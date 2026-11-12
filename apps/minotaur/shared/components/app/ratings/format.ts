import { getLocale } from "@/paraglide/runtime";
import { dayjs } from "@/shared/lib/dayjs";

type DurationUnit = "day" | "hour" | "minute";

const formatUnit = (value: number, unit: DurationUnit) =>
	new Intl.NumberFormat(getLocale(), {
		style: "unit",
		unit,
		unitDisplay: "short",
		maximumFractionDigits: 0,
	}).format(value);

export function formatNumber(value: number | null | undefined): string {
	if (value == null || !Number.isFinite(value)) return "—";

	return new Intl.NumberFormat(getLocale(), {
		maximumFractionDigits: 2,
	}).format(value);
}

/** Playtime arrives in milliseconds. */
export function formatDuration(value: number | null | undefined): string {
	if (value == null || !Number.isFinite(value)) return "—";
	if (value <= 0) return formatUnit(0, "minute");

	const duration = dayjs.duration(value);
	const days = Math.floor(duration.asDays());
	const hours = duration.hours();
	const minutes = duration.minutes();

	const parts: string[] = [];
	if (days) parts.push(formatUnit(days, "day"));
	if (hours) parts.push(formatUnit(hours, "hour"));
	if (!days && minutes) parts.push(formatUnit(minutes, "minute"));

	return parts.join(" ") || formatUnit(0, "minute");
}
