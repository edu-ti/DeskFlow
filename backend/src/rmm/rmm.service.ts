import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, In } from 'typeorm';
import { Device, DeviceStatus } from './entities/device.entity';
import { DeviceAlert } from './entities/device-alert.entity';
import { IngestHeartbeatDto, CreateDeviceDto } from './dto/rmm.dto';
import { TicketService } from '../tickets/services/ticket.service';

@Injectable()
export class RmmService {
  private readonly logger = new Logger(RmmService.name);

  constructor(
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
    @InjectRepository(DeviceAlert)
    private readonly alertRepo: Repository<DeviceAlert>,
    private readonly ticketService: TicketService,
  ) {}

  async ingestHeartbeat(dto: IngestHeartbeatDto): Promise<{ success: boolean; device_id: number; status: string }> {
    let device = await this.deviceRepo.findOne({
      where: dto.mac_address ? { mac_address: dto.mac_address } : { name: dto.name },
    });

    if (!device) {
      device = this.deviceRepo.create({
        name: dto.name,
        organization_id: dto.organization_id || null,
        device_type: dto.device_type || 'workstation',
      });
    }

    device.name = dto.name;
    if (dto.organization_id) device.organization_id = dto.organization_id;
    if (dto.os_name) device.os_name = dto.os_name;
    if (dto.ip_address) device.ip_address = dto.ip_address;
    if (dto.mac_address) device.mac_address = dto.mac_address;
    if (dto.cpu_model) device.cpu_model = dto.cpu_model;
    if (dto.agent_version) device.agent_version = dto.agent_version;

    device.cpu_usage_percent = dto.cpu_usage_percent !== undefined ? dto.cpu_usage_percent : device.cpu_usage_percent;
    device.ram_total_gb = dto.ram_total_gb !== undefined ? dto.ram_total_gb : device.ram_total_gb;
    device.ram_usage_percent = dto.ram_usage_percent !== undefined ? dto.ram_usage_percent : device.ram_usage_percent;
    device.disk_total_gb = dto.disk_total_gb !== undefined ? dto.disk_total_gb : device.disk_total_gb;
    device.disk_used_gb = dto.disk_used_gb !== undefined ? dto.disk_used_gb : device.disk_used_gb;
    device.disk_usage_percent = dto.disk_usage_percent !== undefined ? dto.disk_usage_percent : device.disk_usage_percent;
    device.last_heartbeat_at = new Date();

    // Determina status de saúde do dispositivo
    let calculatedStatus: DeviceStatus = 'online';
    if (
      (device.disk_usage_percent && device.disk_usage_percent >= 90) ||
      (device.cpu_usage_percent && device.cpu_usage_percent >= 95)
    ) {
      calculatedStatus = 'critical';
    } else if (
      (device.disk_usage_percent && device.disk_usage_percent >= 80) ||
      (device.cpu_usage_percent && device.cpu_usage_percent >= 85) ||
      (device.ram_usage_percent && device.ram_usage_percent >= 90)
    ) {
      calculatedStatus = 'warning';
    }

    device.status = calculatedStatus;
    const savedDevice = await this.deviceRepo.save(device);

    // Avaliação e Abertura Automática Inteligente de Chamados
    await this.evaluateAlertsAndAutoTicket(savedDevice);

    return {
      success: true,
      device_id: savedDevice.id,
      status: savedDevice.status,
    };
  }

  /**
   * Avalia regras de RMM e abre chamado automaticamente se condição crítica for atingida
   */
  private async evaluateAlertsAndAutoTicket(device: Device) {
    // 1. Alerta de Disco Quase Cheio (>= 90%)
    if (device.disk_usage_percent && device.disk_usage_percent >= 90) {
      await this.triggerSmartAlert(
        device,
        'disk_full',
        'critical',
        `Espaço em disco crítico: ${device.disk_usage_percent}% utilizado (${device.disk_used_gb || '?'}GB / ${device.disk_total_gb || '?'}GB)`,
        `Alerta RMM: Armazenamento Crítico (${device.disk_usage_percent}%) em ${device.name}`
      );
    }

    // 2. Alerta de Sobrecarga de CPU (>= 95%)
    if (device.cpu_usage_percent && device.cpu_usage_percent >= 95) {
      await this.triggerSmartAlert(
        device,
        'high_cpu',
        'critical',
        `Uso de processador em nível crítico: ${device.cpu_usage_percent}% de CPU contínuo em ${device.name}`,
        `Alerta RMM: Alta Utilização de CPU (${device.cpu_usage_percent}%) em ${device.name}`
      );
    }
  }

  private async triggerSmartAlert(
    device: Device,
    alertType: string,
    severity: 'warning' | 'critical',
    message: string,
    ticketTitle: string
  ) {
    // Evita duplicação: verifica se já existe alerta não resolvido do mesmo tipo para o dispositivo
    const existingAlert = await this.alertRepo.findOne({
      where: {
        device_id: device.id,
        alert_type: alertType,
        is_resolved: false,
      },
    });

    if (existingAlert) {
      return; // Já possui alerta ativo / chamado aberto
    }

    // Cria o registro do alerta
    const alert = this.alertRepo.create({
      device_id: device.id,
      alert_type: alertType,
      severity,
      message,
      is_resolved: false,
    });
    const savedAlert = await this.alertRepo.save(alert);

    // Se severidade crítica, abre chamado automático no DeskFlow
    if (severity === 'critical') {
      try {
        const initialBody =
          `🚨 **Abertura Automática Inteligente - RMM DeskFlow**\n\n` +
          `Foi detectada uma não conformidade crítica no dispositivo monitorado:\n` +
          `- **Dispositivo / Hostname:** ${device.name}\n` +
          `- **Sistema Operacional:** ${device.os_name || 'Desconhecido'}\n` +
          `- **Endereço IP:** ${device.ip_address || 'Não informado'}\n` +
          `- **Diagnóstico:** ${message}\n` +
          `- **Métricas Atuais:** CPU: ${device.cpu_usage_percent || 0}% | RAM: ${device.ram_usage_percent || 0}% | Disco: ${device.disk_usage_percent || 0}%\n\n` +
          `*Ação requerida: Verificar processos ou realizar limpeza preventiva de disco.*`;

        const ticketData = {
          title: ticketTitle,
          group_id: 1, // Suporte / Infra
          priority_id: 3, // Alta
          state_id: 2, // Aberto
          source: 'rmm',
        };

        const createdTicket = await this.ticketService.createTicket(ticketData, initialBody, [], []);

        if (createdTicket) {
          savedAlert.ticket_id = createdTicket.id;
          await this.alertRepo.save(savedAlert);
          this.logger.log(`Chamado #${createdTicket.id} aberto automaticamente para o dispositivo ${device.name}`);
        }
      } catch (err) {
        this.logger.error(`Falha ao abrir chamado automático RMM para ${device.name}`, err);
      }
    }
  }

  async findAllDevices(filter?: { organization_id?: number; status?: string; search?: string }): Promise<Device[]> {
    const qb = this.deviceRepo.createQueryBuilder('device')
      .leftJoinAndSelect('device.organization', 'organization')
      .leftJoinAndSelect('device.assigned_user', 'assigned_user');

    if (filter?.organization_id) {
      qb.andWhere('device.organization_id = :orgId', { orgId: filter.organization_id });
    }

    if (filter?.status) {
      qb.andWhere('device.status = :status', { status: filter.status });
    }

    if (filter?.search) {
      qb.andWhere('(LOWER(device.name) LIKE :q OR LOWER(device.ip_address) LIKE :q OR LOWER(device.os_name) LIKE :q)', {
        q: `%${filter.search.toLowerCase()}%`,
      });
    }

    return qb.orderBy('device.updated_at', 'DESC').getMany();
  }

  async findDeviceById(id: number): Promise<Device> {
    const device = await this.deviceRepo.findOne({
      where: { id },
      relations: ['organization', 'assigned_user'],
    });
    if (!device) throw new NotFoundException(`Dispositivo #${id} não encontrado`);
    return device;
  }

  async createDevice(dto: CreateDeviceDto): Promise<Device> {
    const device = this.deviceRepo.create(dto);
    return this.deviceRepo.save(device);
  }

  async updateDevice(id: number, dto: Partial<Device>): Promise<Device> {
    const device = await this.findDeviceById(id);
    Object.assign(device, dto);
    return this.deviceRepo.save(device);
  }

  async removeDevice(id: number): Promise<{ success: boolean }> {
    const device = await this.findDeviceById(id);
    await this.deviceRepo.softDelete(device.id);
    return { success: true };
  }

  async findAllAlerts(filter?: { device_id?: number; is_resolved?: boolean }): Promise<DeviceAlert[]> {
    const where: any = {};
    if (filter?.device_id) where.device_id = filter.device_id;
    if (filter?.is_resolved !== undefined) where.is_resolved = filter.is_resolved;

    return this.alertRepo.find({
      where,
      relations: ['device', 'ticket'],
      order: { created_at: 'DESC' },
    });
  }

  async resolveAlert(id: number): Promise<DeviceAlert> {
    const alert = await this.alertRepo.findOne({ where: { id } });
    if (!alert) throw new NotFoundException(`Alerta #${id} não encontrado`);
    alert.is_resolved = true;
    return this.alertRepo.save(alert);
  }

  generatePowerShellAgentScript(serverUrl: string, organizationId?: number): string {
    return `# ==========================================
# DeskFlow RMM Agent - Coleta Automática de Telemetria
# ==========================================
$ServerUrl = "${serverUrl.replace(/\/$/, '')}/rmm/heartbeat"
$OrgId = ${organizationId || 'null'}

function Send-DeskFlowHeartbeat {
    try {
        $hostname = $env:COMPUTERNAME
        $os = (Get-CimInstance Win32_OperatingSystem).Caption
        $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.254*" } | Select-Object -First 1).IPAddress
        $mac = (Get-NetAdapter | Where-Object { $_.Status -eq 'Up' } | Select-Object -First 1).MacAddress

        $cpuModel = (Get-CimInstance Win32_Processor).Name
        $cpuUsage = [math]::Round((Get-Counter '\\Processor(_Total)\\% Processor Time' -SampleInterval 1 -MaxSamples 1).CounterSamples.CookedValue, 1)

        $totalRamGb = [math]::Round(((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB), 2)
        $freeRamGb = [math]::Round(((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory / 1MB), 2)
        $ramUsage = [math]::Round((($totalRamGb - $freeRamGb) / $totalRamGb) * 100, 1)

        $systemDrive = Get-PSDrive -Name C
        $diskTotalGb = [math]::Round(($systemDrive.Used + $systemDrive.Free) / 1GB, 2)
        $diskUsedGb = [math]::Round($systemDrive.Used / 1GB, 2)
        $diskUsage = [math]::Round(($systemDrive.Used / ($systemDrive.Used + $systemDrive.Free)) * 100, 1)

        $payload = @{
            name = $hostname
            organization_id = $OrgId
            os_name = $os
            ip_address = $ip
            mac_address = $mac
            cpu_model = $cpuModel
            cpu_usage_percent = $cpuUsage
            ram_total_gb = $totalRamGb
            ram_usage_percent = $ramUsage
            disk_total_gb = $diskTotalGb
            disk_used_gb = $diskUsedGb
            disk_usage_percent = $diskUsage
            agent_version = "1.0.0"
        } | ConvertTo-Json

        Invoke-RestMethod -Uri $ServerUrl -Method Post -Body $payload -ContentType "application/json" -TimeoutSec 10 | Out-Null
        Write-Host "[$([DateTime]::Now.ToString('HH:mm:ss'))] Heartbeat enviado com sucesso para o DeskFlow." -ForegroundColor Green
    } catch {
        Write-Host "[$([DateTime]::Now.ToString('HH:mm:ss'))] Erro ao enviar telemetria: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "Iniciando Agente DeskFlow RMM em segundo plano..." -ForegroundColor Cyan
while ($true) {
    Send-DeskFlowHeartbeat
    Start-Sleep -Seconds 60
}
`;
  }
}
