import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  MapPin,
  Search,
} from "lucide-react";
import { seasonApi, type Season } from "@/services/season.service";
import {
  getAreaOptions,
  getCityOptions,
  getCampaignsForScope,
  getStreetOptions,
  scopeToPath,
  type ExploreScope,
} from "@/data/consumerExploreData";
import { getConsumerCommunity, setConsumerCommunity } from "@/data/consumerHomeData";
import {
  ChangeLocationModal,
  type LocationApplyPayload,
} from "@/components/consumer/ChangeLocationModal";
import type { DemoCampaign } from "@/data/demo";

const formatCurrency = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const getModeLabel = (mode: string) => (mode === "fund" ? "Fund" : "Donate");

function getCampaignStatus(deadline: string): { label: string; active: boolean } {
  const active = new Date(deadline).getTime() > Date.now();
  return { label: active ? "Active" : "Ended", active };
}

function ConsumerCampaignCard({ campaign }: { campaign: DemoCampaign }) {
  const pct =
    campaign.goalAmount > 0
      ? Math.min(100, Math.round((campaign.raisedAmount / campaign.goalAmount) * 100))
      : 0;
  const status = getCampaignStatus(campaign.deadline);

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      {campaign.featuredImage ? (
        <img
          src={campaign.featuredImage}
          alt={campaign.title}
          className="h-36 w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="h-36 w-full bg-gray-100" />
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700">
              {getModeLabel(campaign.mode)}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                status.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
              }`}
            >
              {status.label}
            </span>
          </div>
          <span className="text-xs text-gray-500">Ends {formatDate(campaign.deadline)}</span>
        </div>

        <h3 className="text-sm font-bold text-gray-900 group-hover:text-primary-700">
          {campaign.title}
        </h3>
        <p className="line-clamp-2 text-sm text-gray-500">{campaign.shortDescription}</p>

        {campaign.location ? (
          <p className="flex items-center gap-1 text-xs text-gray-500">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary-500" />
            <span className="truncate">{campaign.location}</span>
          </p>
        ) : null}

        <div className="mt-auto">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-semibold text-gray-700">
              {formatCurrency(campaign.raisedAmount)} raised
            </span>
            <span>of {formatCurrency(campaign.goalAmount)} target</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div className="h-1.5 rounded-full bg-primary-600" style={{ width: `${pct}%` }} />
          </div>
          <Link
            to={`/consumer/explore/campaign/${campaign.slug}`}
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 group-hover:text-primary-700"
          >
            View Campaign
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function LocationBar({
  locationText,
  onChangeLocation,
  onSearch,
}: {
  locationText: string;
  onChangeLocation: () => void;
  onSearch: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 bg-white px-3 py-2.5 shadow-sm">
      <div className="flex min-w-0 items-center gap-2">
        <MapPin className="h-4 w-4 shrink-0 text-primary-600" />
        <span className="truncate text-sm font-semibold text-gray-900">{locationText}</span>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onSearch}
          aria-label="Search location"
          title="Search location"
          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <Search className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onChangeLocation}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          Change location
        </button>
      </div>
    </div>
  );
}

export function ConsumerExplorePage() {
  const { citySlug, areaSlug, streetSlug } = useParams<{
    citySlug: string;
    areaSlug: string;
    streetSlug: string;
  }>();
  const navigate = useNavigate();
  const [season, setSeason] = useState<Season | null>(null);
  const [campaigns, setCampaigns] = useState<DemoCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [focusSearch, setFocusSearch] = useState(false);

  const community = getConsumerCommunity();

  const scope: ExploreScope = citySlug
    ? { citySlug, areaSlug, streetSlug }
    : {
        citySlug: community.citySlug,
        areaSlug: community.areaSlug,
        streetSlug: community.streetSlug,
      };
  const scopeCity = scope.citySlug;
  const scopeArea = scope.areaSlug;
  const scopeStreet = scope.streetSlug;

  useEffect(() => {
    let cancelled = false;
    seasonApi.getCurrent().then((s) => {
      if (!cancelled) setSeason(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      setCampaigns(
        getCampaignsForScope({ citySlug: scopeCity, areaSlug: scopeArea, streetSlug: scopeStreet }),
      );
      setLoading(false);
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [scopeCity, scopeArea, scopeStreet]);

  const cities = useMemo(() => getCityOptions(), []);
  const areas = useMemo(
    () => (citySlug && areaSlug ? getAreaOptions(citySlug) : []),
    [citySlug, areaSlug],
  );
  const streets = useMemo(
    () => (citySlug && areaSlug && streetSlug ? getStreetOptions(citySlug, areaSlug) : []),
    [citySlug, areaSlug, streetSlug],
  );

  const cityName = scope.citySlug
    ? citySlug
      ? cities.find((o) => o.slug === citySlug)?.name ?? citySlug
      : community.cityName
    : undefined;
  const areaName = scope.areaSlug
    ? areaSlug
      ? areas.find((o) => o.slug === areaSlug)?.name ?? areaSlug
      : community.areaName
    : undefined;
  const streetName = scope.streetSlug
    ? streetSlug
      ? streets.find((o) => o.slug === streetSlug)?.name ?? streetSlug
      : community.streetName
    : undefined;

  const locationText =
    [streetName, areaName, cityName].filter(Boolean).join(", ") || "All locations";

  const cityPath = citySlug ? `/consumer/explore/city/${citySlug}` : "/consumer/explore";
  const areaPath = citySlug && areaSlug ? `${cityPath}/area/${areaSlug}` : cityPath;
  const backPath = streetSlug
    ? areaPath
    : areaSlug
      ? cityPath
      : citySlug
        ? "/consumer/explore"
        : null;

  const openModal = (withSearch: boolean) => {
    setFocusSearch(withSearch);
    setModalOpen(true);
  };

  const handleApply = (payload: LocationApplyPayload) => {
    if (payload.community) setConsumerCommunity(payload.community);
    setModalOpen(false);
    navigate(scopeToPath(payload.scope));
  };

  const handleUseMyLocation = () => {
    setModalOpen(false);
    navigate("/consumer/explore");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Explore</h1>
        {backPath ? (
          <button
            type="button"
            onClick={() => navigate(backPath)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        ) : null}
      </div>

      <LocationBar
        locationText={locationText}
        onChangeLocation={() => openModal(false)}
        onSearch={() => openModal(true)}
      />

      {season && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <CalendarDays className="h-4 w-4 text-primary-600" />
            <span className="font-semibold text-gray-900">{season.name}</span>
            <span className="text-gray-300">·</span>
            <span className="text-xs text-gray-500">
              {formatDate(season.startDate)} – {formatDate(season.endDate)}
            </span>
          </div>
          <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
            {season.status === "ACTIVE" ? "Active" : season.status}
          </span>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white p-10 text-center">
          <MapPin className="mx-auto h-8 w-8 text-gray-300" />
          <h2 className="mt-3 text-lg font-semibold text-gray-900">
            No campaigns in this area yet
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Try widening your search to a bigger area or your own location.
          </p>
          <button
            type="button"
            onClick={() => navigate(backPath ?? "/consumer/explore")}
            className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
          >
            Widen search
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500">
            {campaigns.length} campaign{campaigns.length === 1 ? "" : "s"}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {campaigns.map((c) => (
              <ConsumerCampaignCard key={c.slug} campaign={c} />
            ))}
          </div>
        </>
      )}

      <ChangeLocationModal
        open={modalOpen}
        initialScope={scope}
        currentLocationText={locationText}
        focusSearch={focusSearch}
        onClose={() => setModalOpen(false)}
        onApply={handleApply}
        onUseMyLocation={handleUseMyLocation}
      />
    </div>
  );
}


