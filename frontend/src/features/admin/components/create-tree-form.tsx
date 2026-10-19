import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { PublicKey } from '@solana/web3.js';
import { useAdmin } from '../admin-context';
import { useAuth } from '../../auth/auth-context';
import { createCampaignFormSchema } from '../schemas';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Field } from '../../../components/ui/field';
import { ErrorMessage } from '../../../components/ui/feedback';
import { usePrepareMockReporter } from '../hooks/use-mock-reporter';
import { treeAddress } from '../../../chain/addresses';
import { api, jsonBody } from '../../../lib/api';
import { campaignDossierSchema } from '../../../lib/schemas';

interface ArchetypePreset {
  name: string;
  victronSiteId: number;
  title: string;
  subtitle: string;
  category: string;
  categoryBadge: string;
  city: string;
  country: string;
  projectedApy: string;
  tariffRate: string;
  offTakerName: string;
  target: string;
  narrative: string;
  story: string;
}

const PRESETS: ArchetypePreset[] = [
  {
    name: 'Treetino V1 · Smart Tree',
    victronSiteId: 100001,
    title: 'Treetino V1: Biomimetic Solar & Wind Tree at MKovo',
    subtitle: 'Dual-Modality Microgrid with Ducted Wind Turbines',
    category: 'Biomimetic Tree',
    categoryBadge: 'Solar + Wind Tree',
    city: 'Poprad',
    country: 'Slovakia',
    projectedApy: '12.8%',
    tariffRate: 'USDC 0.32 / kWh corporate PPA (MKovo s.r.o.)',
    offTakerName: 'MKovo s.r.o.',
    target: '250000',
    narrative:
      'Flagship 12m vertical micro-power plant combining 300 heliotropic solar leaves and 12 ducted VAWT wind turbines. Streams live Cerbo GX telemetry on Solana.',
    story:
      'Installed at MKovo s.r.o. metal fabrication plant, generating baseload clean power around the clock with dual-modality harvesting.',
  },
  {
    name: 'Commercial ESS · Amsterdam',
    victronSiteId: 98321,
    title: 'Amsterdam Commercial BESS Warehouse Arbitrage',
    subtitle: 'High-Voltage Battery Storage & Grid Ancillary Services',
    category: 'Commercial ESS',
    categoryBadge: 'Commercial ESS',
    city: 'Amsterdam',
    country: 'Netherlands',
    projectedApy: '14.2%',
    tariffRate: 'Dynamic spot spread: USDC 0.18 / kWh peak vs off-peak',
    offTakerName: 'EnergyHub Amsterdam B.V.',
    target: '200000',
    narrative:
      'Grid-scale lithium battery storage system performing automated wholesale price arbitrage on European spot power exchanges. Cerbo GX telemetry.',
    story:
      'Utilizes dual MultiPlus-II inverters and Lynx Smart BMS to charge during solar surplus and discharge during peak grid demand spikes.',
  },
  {
    name: 'EV Fleet Plaza · Paris',
    victronSiteId: 154820,
    title: 'Paris Solar Canopy Fleet Supercharger Plaza',
    subtitle: 'Commercial Fleet Fast-Charging Hub with Buffer Battery',
    category: 'EV Fast-Charging',
    categoryBadge: 'EV Fast-Charging',
    city: 'Paris',
    country: 'France',
    projectedApy: '18.5%',
    tariffRate: 'USDC 0.45 / kWh high-power DC fast-charging tariff',
    offTakerName: 'ChargeVolt Paris SAS',
    target: '350000',
    narrative:
      'High-throughput EV charging hub powered by 85 kW rooftop solar canopy and 120 kWh buffer battery, servicing commercial delivery vans and rideshare fleets.',
    story:
      'Combines peak solar shaving with DC fast-charging, capturing high-margin commercial fleet charging demand in central Paris.',
  },
  {
    name: 'Off-Grid Homestead · QLD',
    victronSiteId: 209689,
    title: 'Queensland Autonomous Off-Grid Solar Homestead',
    subtitle: 'Resilient Outback Solar Microgrid with Lithium Storage',
    category: 'Off-Grid Solar',
    categoryBadge: 'Off-Grid Solar',
    city: 'Queensland',
    country: 'Australia',
    projectedApy: '8.5%',
    tariffRate: 'USDC 0.40 / kWh metered consumer consumption',
    offTakerName: 'Outback Queensland Property',
    target: '20000',
    narrative:
      'Community microgrid enabling permissionless clean power. Backers fund rooftop solar and lithium battery storage replacing expensive off-grid diesel generation.',
    story:
      'Remote agricultural homestead eliminating fossil diesel fuel consumption via continuous solar PV and MultiPlus-II inverter management.',
  },
];

export function CreateTreeForm() {
  const { setup, disabled, transaction, wallet } = useAdmin();
  const { session } = useAuth();
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const allowed =
    setup.data?.admins.includes(wallet) && setup.data.paymentTokenInitialized;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<
    z.input<typeof createCampaignFormSchema>,
    unknown,
    z.output<typeof createCampaignFormSchema>
  >({
    resolver: zodResolver(createCampaignFormSchema),
    defaultValues: {
      treeId: '1',
      target: '20000',
      supplier: '',
      client: '',
      reporter: '',
      title: 'Off-Grid Solar Microgrid Phase II',
      subtitle: 'Queensland Rural Clean Energy Transition',
      category: 'Off-Grid Solar',
      categoryBadge: 'Off-Grid Solar',
      city: 'Queensland',
      country: 'Australia',
      projectedApy: '8.5%',
      tariffRate: 'USDC 0.40 / kWh metered consumer consumption',
      offTakerName: 'Queensland Rural Resident',
      narrative:
        'Community microgrid enabling permissionless clean power. Backers fund rooftop solar and lithium battery storage replacing expensive off-grid diesel generation.',
      story:
        'Off-grid homeowner replacing diesel generation with tokenized rooftop solar equity.',
    },
  });

  const reporter = usePrepareMockReporter(
    useWatch({ control, name: 'treeId' }),
    !!allowed,
  );

  useEffect(() => {
    if (reporter.data?.wallet) {
      setValue('reporter', reporter.data.wallet);
    }
  }, [reporter.data?.wallet, setValue]);

  const handleApplyPreset = (preset: ArchetypePreset) => {
    setValue('title', preset.title);
    setValue('subtitle', preset.subtitle);
    setValue('category', preset.category);
    setValue('categoryBadge', preset.categoryBadge);
    setValue('city', preset.city);
    setValue('country', preset.country);
    setValue('projectedApy', preset.projectedApy);
    setValue('tariffRate', preset.tariffRate);
    setValue('offTakerName', preset.offTakerName);
    setValue('target', preset.target);
    setValue('narrative', preset.narrative);
    setValue('story', preset.story);
    setValue('victronSiteId', preset.victronSiteId);
  };

  const onSubmit = async (data: z.output<typeof createCampaignFormSchema>) => {
    try {
      setSaveStatus('Deploying on-chain tree and launching campaign…');
      // 1. Submit on-chain initTree
      transaction.mutate(
        {
          action: 'initTree',
          treeId: data.treeId,
          target: data.target,
          supplier: data.supplier,
          client: data.client,
          reporter: data.reporter,
          reporterFundingLamports: '50000000',
        },
        {
          onSuccess: async () => {
            // 2. Compute canonical tree address
            const computedAddress = treeAddress(
              new PublicKey(wallet),
              data.treeId,
            ).toBase58();

            // 3. Save campaign metadata to backend if authenticated
            if (session?.accessToken) {
              try {
                await api('campaigns', campaignDossierSchema, {
                  ...jsonBody({
                    treeAddress: computedAddress,
                    treeId: data.treeId,
                    title: data.title,
                    subtitle: data.subtitle,
                    category: data.category,
                    categoryBadge: data.categoryBadge,
                    narrative: data.narrative,
                    story: data.story,
                    investorHighlight: `Projected yield: ${data.projectedApy}. Verified on-site by Cerbo GX hardware.`,
                    victronSiteId: data.victronSiteId,
                    city: data.city,
                    country: data.country,
                    projectedApy: data.projectedApy,
                    tariffRate: data.tariffRate,
                    offTakerName: data.offTakerName,
                    offTakerDescription: data.offTakerDescription,
                    supplierName: data.supplierName,
                    targetUsdc: data.target,
                  }),
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.accessToken}`,
                  },
                });
                setSaveStatus(
                  `Campaign "${data.title}" successfully published! Tree address: ${computedAddress.slice(0, 8)}…`,
                );
              } catch (err: unknown) {
                setSaveStatus(
                  `On-chain tree initialized. Metadata note: ${err instanceof Error ? err.message : String(err)}`,
                );
              }
            }
          },
        },
      );
    } catch (err: unknown) {
      setSaveStatus(
        `Error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  return (
    <Card title="Launch New Funding Opportunity (Kickstarter Campaign)">
      <p className="mb-4 text-sm text-zinc-600">
        Set up a tokenized clean energy asset pool. Connect live Victron VRM
        telemetry, explain the off-taker agreement, and invite community
        investors to fund hardware on Solana.
      </p>

      {/* Preset Archetype Buttons */}
      <div className="mb-6 rounded-2xl border border-black/10 bg-zinc-50 p-4">
        <span className="block font-mono text-xs font-bold text-zinc-700 uppercase">
          Quick Start from Verified Victron DePIN Hardware:
        </span>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.victronSiteId}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className="rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs font-bold text-zinc-900 hover:bg-zinc-100 hover:border-black/20 transition shadow-2xs"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {!allowed && (
        <p className="mb-4 text-sm text-amber-800">
          Initialize the payment token and ensure your wallet is listed in the
          chain admin list first.
        </p>
      )}

      <ErrorMessage error={reporter.error} />
      {reporter.isFetching && (
        <p className="mb-4 text-sm font-mono text-t-blue">
          Preparing the tree’s simulated Cerbo GX reporter wallet…
        </p>
      )}

      {saveStatus && (
        <p className="mb-4 rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs font-mono text-t-blue">
          {saveStatus}
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <fieldset
          disabled={disabled || !allowed}
          className="space-y-6 disabled:opacity-60"
        >
          {/* Section 1: Campaign Narrative */}
          <div className="rounded-2xl border border-black/10 bg-white p-5">
            <h4 className="font-bold text-sm text-zinc-950 mb-3">
              1. Campaign Story & Asset Dossier
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Campaign Title"
                {...register('title')}
                error={errors.title?.message}
              />
              <Field
                label="Subtitle / Headline"
                {...register('subtitle')}
                error={errors.subtitle?.message}
              />
              <Field
                label="Category (e.g. Off-Grid Solar, Battery ESS)"
                {...register('category')}
                error={errors.category?.message}
              />
              <Field
                label="Category Badge"
                {...register('categoryBadge')}
                error={errors.categoryBadge?.message}
              />
              <Field
                label="Installation City"
                {...register('city')}
                error={errors.city?.message}
              />
              <Field
                label="Country"
                {...register('country')}
                error={errors.country?.message}
              />
            </div>
            <div className="mt-4">
              <Field
                label="Elevator Pitch / Narrative (1-2 sentences)"
                {...register('narrative')}
                error={errors.narrative?.message}
              />
            </div>
            <div className="mt-4">
              <Field
                label="Detailed Project Story & Hardware Specifications"
                {...register('story')}
                error={errors.story?.message}
              />
            </div>
          </div>

          {/* Section 2: Economics & Off-Taker PPA */}
          <div className="rounded-2xl border border-black/10 bg-white p-5">
            <h4 className="font-bold text-sm text-zinc-950 mb-3">
              2. Economics, Yield & Off-Taker PPA
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Projected Investor APY (e.g. 14.2%)"
                {...register('projectedApy')}
                error={errors.projectedApy?.message}
              />
              <Field
                label="Tariff Rate (e.g. USDC 0.40/kWh)"
                {...register('tariffRate')}
                error={errors.tariffRate?.message}
              />
              <Field
                label="Off-Taker / Client Name"
                {...register('offTakerName')}
                error={errors.offTakerName?.message}
              />
              <Field
                label="Funding Target (USDC)"
                {...register('target')}
                error={errors.target?.message}
              />
            </div>
          </div>

          {/* Section 3: On-Chain Wallets & Hardware Telemetry */}
          <div className="rounded-2xl border border-black/10 bg-white p-5">
            <h4 className="font-bold text-sm text-zinc-950 mb-3">
              3. On-Chain Protocol & Hardware Signers
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Tree ID (unique integer for your wallet)"
                {...register('treeId')}
                error={errors.treeId?.message}
              />
              <Field
                label="Victron VRM Site ID (optional, e.g. 209689)"
                type="number"
                {...register('victronSiteId', { valueAsNumber: true })}
                error={errors.victronSiteId?.message}
              />
              <Field
                label="Supplier Wallet (receives capital upon funding)"
                {...register('supplier')}
                error={errors.supplier?.message}
              />
              <Field
                label="Client Wallet (pays metered energy invoices)"
                {...register('client')}
                error={errors.client?.message}
              />
              <Field
                label="Reporter Wallet (Cerbo GX signer for production)"
                {...register('reporter')}
                error={errors.reporter?.message}
              />
            </div>
          </div>

          <Button type="submit" className="w-full sm:w-auto">
            Launch Campaign & Deploy On-Chain Pool →
          </Button>
        </fieldset>
      </form>
    </Card>
  );
}
