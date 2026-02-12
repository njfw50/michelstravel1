import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Armchair, Info, XCircle, Users, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Skeleton } from "@/components/ui/skeleton";

interface SeatData {
  id: string;
  designator: string;
  available: boolean;
  type: string;
  disclosures: string[];
  price: string;
  currency: string;
  serviceId: string;
}

interface RowData {
  sectionNumber: string;
  seats: SeatData[];
}

interface CabinData {
  deckType: string;
  wings: { firstRowIndex: number; lastRowIndex: number };
  rows: RowData[];
}

interface SeatMapSegment {
  sliceId: string;
  segmentId: string;
  cabins: CabinData[];
}

interface SeatMapResponse {
  available: boolean;
  seatMaps: SeatMapSegment[];
}

interface SeatSelection {
  segmentId: string;
  designator: string;
  serviceId: string;
  price: number;
  currency: string;
}

interface SeatMapProps {
  offerId: string;
  onSeatSelected: (seatSelection: SeatSelection[]) => void;
  passengerCount: number;
}

const COLUMN_ORDER = ["A", "B", "C", "D", "E", "F"];
const LEFT_COLUMNS = ["A", "B", "C"];
const RIGHT_COLUMNS = ["D", "E", "F"];

function getSeatColumn(designator: string): string {
  return designator.replace(/\d+/g, "");
}

function getSeatRow(designator: string): string {
  return designator.replace(/[A-Z]/g, "");
}

function isExtraLegroom(seat: SeatData): boolean {
  return (
    seat.type === "extra_legroom" ||
    seat.disclosures.some(
      (d) =>
        d.toLowerCase().includes("exit") ||
        d.toLowerCase().includes("legroom") ||
        d.toLowerCase().includes("extra")
    )
  );
}

function seatsForSegment(selectedSeats: Map<string, SeatSelection>, segmentId: string): number {
  let count = 0;
  selectedSeats.forEach((v) => {
    if (v.segmentId === segmentId) count++;
  });
  return count;
}

export default function SeatMap({ offerId, onSeatSelected, passengerCount }: SeatMapProps) {
  const { t } = useI18n();
  const [selectedSeats, setSelectedSeats] = useState<Map<string, SeatSelection>>(new Map());
  const [currentPassenger, setCurrentPassenger] = useState(0);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<SeatMapResponse>({
    queryKey: ["/api/flights", offerId, "seat-map"],
    enabled: !!offerId,
  });

  const segments = data?.seatMaps ?? [];
  const effectiveSegmentId = activeSegmentId ?? segments[0]?.segmentId ?? "";
  const segmentIndex = segments.findIndex((s) => s.segmentId === effectiveSegmentId);

  const handleSeatClick = useCallback(
    (seat: SeatData, segmentId: string) => {
      if (!seat.available) return;

      setSelectedSeats((prev) => {
        const next = new Map(prev);
        const compositeKey = `pax-${currentPassenger}-seg-${segmentId}`;

        const existingEntry = Array.from(next.entries()).find(
          ([, v]) => v.designator === seat.designator && v.segmentId === segmentId
        );

        if (existingEntry) {
          next.delete(existingEntry[0]);

          const nextPax = findNextOpenPassenger(next, segmentId, 0, passengerCount);
          setCurrentPassenger(nextPax);

          setTimeout(() => {
            onSeatSelected(Array.from(next.values()));
          }, 0);
          return next;
        }

        if (seatsForSegment(next, segmentId) >= passengerCount) return prev;

        if (next.has(compositeKey)) {
          next.delete(compositeKey);
        }

        next.set(compositeKey, {
          segmentId,
          designator: seat.designator,
          serviceId: seat.serviceId,
          price: parseFloat(seat.price),
          currency: seat.currency,
        });

        const nextPax = findNextOpenPassenger(next, segmentId, currentPassenger + 1, passengerCount);
        setCurrentPassenger(nextPax);

        setTimeout(() => {
          onSeatSelected(Array.from(next.values()));
        }, 0);

        return next;
      });
    },
    [currentPassenger, passengerCount, onSeatSelected]
  );

  const totalSeatCost = useMemo(() => {
    let total = 0;
    selectedSeats.forEach((s) => {
      total += s.price;
    });
    return total;
  }, [selectedSeats]);

  const currency = useMemo(() => {
    const first = Array.from(selectedSeats.values())[0];
    return first?.currency || "USD";
  }, [selectedSeats]);

  if (isLoading) {
    return (
      <Card className="border border-gray-200 shadow-sm rounded-2xl">
        <CardHeader className="border-b border-gray-100 gap-2">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Armchair className="h-5 w-5 text-blue-500" />
            {t("seatmap.title") || "Seat Selection"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError || !data?.available || !data?.seatMaps?.length) {
    return (
      <Card className="border border-gray-200 shadow-sm rounded-2xl">
        <CardHeader className="border-b border-gray-100 gap-2">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Armchair className="h-5 w-5 text-blue-500" />
            {t("seatmap.title") || "Seat Selection"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-3 py-8 text-center" data-testid="seatmap-unavailable">
            <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center">
              <Armchair className="h-7 w-7 text-gray-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                {t("seatmap.unavailable_title") || "Seat selection unavailable"}
              </p>
              <p className="text-xs text-gray-400 max-w-xs">
                {t("seatmap.unavailable") || "Seats will be automatically assigned at check-in. You can request specific seats at the airport."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const groupedBySegment = segments.map((seg, idx) => {
    const entries = Array.from(selectedSeats.entries()).filter(
      ([, v]) => v.segmentId === seg.segmentId
    );
    return { segment: seg, segIndex: idx, entries };
  });

  const seatsSelectedCount = selectedSeats.size;
  const totalSeatsNeeded = passengerCount * segments.length;

  return (
    <Card className="border border-gray-200 shadow-sm rounded-2xl">
      <CardHeader className="border-b border-gray-100 gap-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Armchair className="h-5 w-5 text-blue-500" />
            {t("seatmap.title") || "Seat Selection"}
          </CardTitle>
          <span className="text-xs text-gray-400">
            {t("seatmap.optional") || "Optional"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6 space-y-5">
        <div className="flex items-center gap-3 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3" data-testid="seatmap-passenger-indicator">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-blue-600">{currentPassenger + 1}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-800">
              {t("seatmap.selecting_for") || "Selecting seat for"}{" "}
              {t("booking.passenger") || "Passenger"} {currentPassenger + 1}
            </p>
            {segments.length > 1 && (
              <p className="text-xs text-blue-500">
                {t("seatmap.flight_segment") || "Flight"} {(segmentIndex >= 0 ? segmentIndex : 0) + 1} {t("seatmap.of") || "of"} {segments.length}
              </p>
            )}
          </div>
        </div>

        {selectedSeats.size > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t("seatmap.your_seats") || "Your selected seats"}</p>
            <div className="flex flex-wrap gap-2">
              {groupedBySegment.map(({ segment, segIndex, entries }) =>
                entries.map(([key, sel]) => {
                  const paxNum = parseInt(key.split("-seg-")[0].replace("pax-", "")) + 1;
                  return (
                    <div
                      key={key}
                      className="inline-flex items-center gap-2 rounded-lg bg-white border border-blue-200 px-3 py-1.5 shadow-sm"
                      data-testid={`badge-selected-seat-${sel.designator}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-blue-600">{paxNum}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{sel.designator}</span>
                        {segments.length > 1 && (
                          <span className="text-[10px] text-gray-400">
                            ({t("seatmap.flight_short") || "Voo"} {segIndex + 1})
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="text-gray-400 transition-colors"
                        onClick={() => {
                          setSelectedSeats((prev) => {
                            const next = new Map(prev);
                            next.delete(key);
                            const paxIdx = parseInt(key.split("-seg-")[0].replace("pax-", ""));
                            setCurrentPassenger(Math.min(paxIdx, passengerCount - 1));
                            setActiveSegmentId(sel.segmentId);
                            setTimeout(() => {
                              onSeatSelected(Array.from(next.values()));
                            }, 0);
                            return next;
                          });
                        }}
                        data-testid={`button-remove-seat-${sel.designator}`}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {segments.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1" data-testid="seatmap-segment-tabs">
            {segments.map((seg, idx) => {
              const isActive = effectiveSegmentId === seg.segmentId;
              const segSeats = seatsForSegment(selectedSeats, seg.segmentId);
              return (
                <button
                  key={seg.segmentId}
                  type="button"
                  onClick={() => {
                    setActiveSegmentId(seg.segmentId);
                    const nextPax = findNextOpenPassenger(selectedSeats, seg.segmentId, 0, passengerCount);
                    setCurrentPassenger(nextPax);
                  }}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  data-testid={`button-segment-tab-${idx + 1}`}
                >
                  <span>{t("seatmap.flight_label") || "Flight"} {idx + 1}</span>
                  {segSeats > 0 && (
                    <span className={`text-[10px] rounded-full px-1.5 py-0.5 ${isActive ? "bg-white/20 text-white" : "bg-blue-100 text-blue-600"}`}>
                      {segSeats}/{passengerCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {segments.map((seatMap) => (
          <div
            key={seatMap.segmentId}
            style={{ display: segments.length > 1 && seatMap.segmentId !== effectiveSegmentId ? "none" : undefined }}
          >
            <SeatMapGrid
              seatMap={seatMap}
              selectedSeats={selectedSeats}
              onSeatClick={handleSeatClick}
              t={t}
            />
          </div>
        ))}

        <SeatLegend t={t} />

        {selectedSeats.size > 0 && (
          <div
            className="flex items-center justify-between rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-white px-5 py-4"
            data-testid="seatmap-total-cost"
          >
            <div>
              <p className="text-sm font-medium text-gray-700">
                {t("seatmap.total_seat_cost") || "Total for seat selection"}
              </p>
              <p className="text-xs text-gray-400">
                {seatsSelectedCount} {seatsSelectedCount === 1 ? (t("seatmap.seat") || "seat") : (t("seatmap.seats") || "seats")} {t("seatmap.selected_label") || "selected"}
              </p>
            </div>
            <span className="text-lg font-bold text-blue-700">
              {new Intl.NumberFormat("en-US", { style: "currency", currency }).format(totalSeatCost)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function findNextOpenPassenger(
  seats: Map<string, SeatSelection>,
  segmentId: string,
  startFrom: number,
  passengerCount: number
): number {
  for (let i = startFrom; i < passengerCount; i++) {
    if (!seats.has(`pax-${i}-seg-${segmentId}`)) return i;
  }
  for (let i = 0; i < startFrom; i++) {
    if (!seats.has(`pax-${i}-seg-${segmentId}`)) return i;
  }
  return Math.min(startFrom, passengerCount - 1);
}

function SeatMapGrid({
  seatMap,
  selectedSeats,
  onSeatClick,
  t,
}: {
  seatMap: SeatMapSegment;
  selectedSeats: Map<string, SeatSelection>;
  onSeatClick: (seat: SeatData, segmentId: string) => void;
  t: (key: string) => string;
}) {
  const selectedDesignators = useMemo(() => {
    const set = new Set<string>();
    selectedSeats.forEach((v) => {
      if (v.segmentId === seatMap.segmentId) set.add(v.designator);
    });
    return set;
  }, [selectedSeats, seatMap.segmentId]);

  const allRows = useMemo(() => {
    const rows: { rowNumber: string; seatsByColumn: Map<string, SeatData>; isWingRow: boolean }[] = [];
    for (const cabin of seatMap.cabins) {
      for (const row of cabin.rows) {
        const seatsByColumn = new Map<string, SeatData>();
        for (const seat of row.seats) {
          const col = getSeatColumn(seat.designator);
          seatsByColumn.set(col, seat);
        }
        const rowIdx = parseInt(row.sectionNumber);
        const isWingRow =
          cabin.wings &&
          rowIdx >= cabin.wings.firstRowIndex &&
          rowIdx <= cabin.wings.lastRowIndex;
        rows.push({
          rowNumber: row.sectionNumber,
          seatsByColumn,
          isWingRow: !!isWingRow,
        });
      }
    }
    return rows;
  }, [seatMap]);

  return (
    <div className="overflow-x-auto" data-testid="seatmap-grid">
      <div className="mx-auto min-w-[280px] max-w-[360px]">
        <div className="relative rounded-t-[80px] border-x-2 border-t-2 border-gray-200 bg-gradient-to-b from-gray-50 to-white px-4 pt-10 pb-2">
          <div className="absolute left-1/2 top-3 -translate-x-1/2">
            <Armchair className="h-5 w-5 text-gray-300" />
          </div>

          <div className="flex items-center justify-center gap-1 mb-3 px-2">
            <div className="flex gap-1 flex-1 justify-end">
              {LEFT_COLUMNS.map((col) => (
                <div key={col} className="w-9 text-center text-xs font-bold text-gray-400">
                  {col}
                </div>
              ))}
            </div>
            <div className="w-6" />
            <div className="flex gap-1 flex-1">
              {RIGHT_COLUMNS.map((col) => (
                <div key={col} className="w-9 text-center text-xs font-bold text-gray-400">
                  {col}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            {allRows.map((row, rowIdx) => (
              <div key={`row-${row.rowNumber || rowIdx}`} className="flex items-center justify-center gap-1 px-2">
                <div className="flex gap-1 flex-1 justify-end">
                  {LEFT_COLUMNS.map((col) => {
                    const seat = row.seatsByColumn.get(col);
                    if (!seat) return <div key={col} className="w-9 h-8" />;
                    return (
                      <SeatButton
                        key={seat.designator}
                        seat={seat}
                        isSelected={selectedDesignators.has(seat.designator)}
                        segmentId={seatMap.segmentId}
                        onClick={onSeatClick}
                        t={t}
                      />
                    );
                  })}
                </div>
                <div className="w-6 text-center text-[10px] font-medium text-gray-300 shrink-0">
                  {row.rowNumber}
                </div>
                <div className="flex gap-1 flex-1">
                  {RIGHT_COLUMNS.map((col) => {
                    const seat = row.seatsByColumn.get(col);
                    if (!seat) return <div key={col} className="w-9 h-8" />;
                    return (
                      <SeatButton
                        key={seat.designator}
                        seat={seat}
                        isSelected={selectedDesignators.has(seat.designator)}
                        segmentId={seatMap.segmentId}
                        onClick={onSeatClick}
                        t={t}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="h-4 rounded-b-xl border-x-2 border-b-2 border-gray-200 bg-white" />
      </div>
    </div>
  );
}

function SeatButton({
  seat,
  isSelected,
  segmentId,
  onClick,
  t,
}: {
  seat: SeatData;
  isSelected: boolean;
  segmentId: string;
  onClick: (seat: SeatData, segmentId: string) => void;
  t: (key: string) => string;
}) {
  const extra = isExtraLegroom(seat);

  let className = "w-9 h-8 rounded-md text-[10px] font-medium transition-all border ";

  if (!seat.available) {
    className += "bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed";
  } else if (isSelected) {
    className += "bg-blue-600 border-blue-600 text-white cursor-pointer shadow-md shadow-blue-600/20 scale-105";
  } else if (extra) {
    className += "bg-emerald-50 border-emerald-300 text-emerald-700 cursor-pointer hover:bg-emerald-100 hover:border-emerald-400";
  } else {
    className += "bg-white border-gray-300 text-gray-600 cursor-pointer hover:bg-blue-50 hover:border-blue-400";
  }

  const priceLabel = seat.available
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: seat.currency }).format(parseFloat(seat.price))
    : t("seatmap.unavailable_short") || "Unavailable";

  const disclosureText = seat.disclosures.length > 0 ? seat.disclosures.join(", ") : "";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          disabled={!seat.available}
          onClick={() => onClick(seat, segmentId)}
          className={className}
          data-testid={`button-seat-${seat.designator}`}
          aria-label={`${t("seatmap.seat") || "Seat"} ${seat.designator}`}
        >
          {getSeatColumn(seat.designator)}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="bg-gray-900 text-white border-gray-800">
        <div className="text-xs space-y-1 py-0.5">
          <div className="font-bold text-sm">
            {t("seatmap.seat") || "Seat"} {seat.designator}
          </div>
          <div className="text-gray-300">{priceLabel}</div>
          {extra && <div className="text-emerald-400 text-[10px]">{t("seatmap.extra_legroom") || "Extra legroom"}</div>}
          {disclosureText && <div className="text-gray-400 text-[10px]">{disclosureText}</div>}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function SeatLegend({ t }: { t: (key: string) => string }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-gray-500 py-2" data-testid="seatmap-legend">
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-3.5 rounded border border-gray-300 bg-white" />
        <span>{t("seatmap.available") || "Available"}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-3.5 rounded bg-blue-600" />
        <span>{t("seatmap.selected") || "Selected"}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-3.5 rounded bg-gray-100 border border-gray-200" />
        <span>{t("seatmap.unavailable_label") || "Occupied"}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-3.5 rounded border border-emerald-300 bg-emerald-50" />
        <span>{t("seatmap.extra_legroom") || "Extra legroom"}</span>
      </div>
    </div>
  );
}
