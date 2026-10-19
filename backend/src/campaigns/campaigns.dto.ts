import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  CampaignDossier,
  CampaignsResponse,
  CreateCampaignDto,
  TreePhase,
} from '@treetino/contracts';

export class CampaignDossierDto implements CampaignDossier {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ description: 'On-chain tree PDA address' })
  treeAddress!: string;
  @ApiProperty({ description: 'Tree ID' }) treeId!: string;
  @ApiProperty() title!: string;
  @ApiPropertyOptional() subtitle?: string;
  @ApiProperty() category!: string;
  @ApiProperty() categoryBadge!: string;
  @ApiProperty() narrative!: string;
  @ApiPropertyOptional() story?: string;
  @ApiPropertyOptional() investorHighlight?: string;
  @ApiPropertyOptional() victronSiteId?: number;
  @ApiProperty() city!: string;
  @ApiProperty() country!: string;
  @ApiProperty({ example: '14.2%' }) projectedApy!: string;
  @ApiProperty({ example: 'USDC 0.40/kWh' }) tariffRate!: string;
  @ApiProperty() offTakerName!: string;
  @ApiPropertyOptional() offTakerDescription?: string;
  @ApiPropertyOptional() supplierName?: string;
  @ApiProperty({ example: '50000' }) targetUsdc!: string;
  @ApiPropertyOptional({ example: '42100' }) raisedUsdc?: string;
  @ApiPropertyOptional({
    type: String,
    enum: ['funding', 'funded', 'purchased', 'active'],
  })
  phase?: TreePhase;
  @ApiPropertyOptional() canBuy?: boolean;
  @ApiProperty() createdAt!: number;
  @ApiProperty() updatedAt!: number;
}

export class CampaignsResponseDto implements CampaignsResponse {
  @ApiProperty({ type: [CampaignDossierDto] }) campaigns!: CampaignDossierDto[];
  @ApiProperty() total!: number;
}

export class CreateCampaignRequestDto implements CreateCampaignDto {
  @ApiProperty({ description: 'On-chain tree PDA address' })
  treeAddress!: string;
  @ApiPropertyOptional() treeId?: string;
  @ApiProperty() title!: string;
  @ApiPropertyOptional() subtitle?: string;
  @ApiProperty() category!: string;
  @ApiProperty() categoryBadge!: string;
  @ApiProperty() narrative!: string;
  @ApiPropertyOptional() story?: string;
  @ApiPropertyOptional() investorHighlight?: string;
  @ApiPropertyOptional() victronSiteId?: number;
  @ApiProperty() city!: string;
  @ApiProperty() country!: string;
  @ApiProperty({ example: '12.5%' }) projectedApy!: string;
  @ApiProperty({ example: 'USDC 0.35 / kWh' }) tariffRate!: string;
  @ApiProperty() offTakerName!: string;
  @ApiPropertyOptional() offTakerDescription?: string;
  @ApiPropertyOptional() supplierName?: string;
  @ApiProperty({ example: '25000' }) targetUsdc!: string;
}
