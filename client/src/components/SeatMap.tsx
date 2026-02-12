import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Plane, Info, XCircle, Users } from "lucide-react";
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

export default function SeatMap({ offerId, onSeatSelected, passengerCount }: SeatMapProps) {
  const { t } = useI18n();
  const [selectedSeats, setSelectedSeats] = useState<Map<string, SeatSelection>>(new Map());
  const [currentPassenger, setCurrentPassenger] = useState(0);

  const { data, isLoading, isError } = useQuery<SeatMapResponse>({
    queryKey: ["/api/flights", offerId, "seat-map"],
    enabled: !!offerId,
  });

  const handleSeatClick = useCallback(
    (seat: SeatData, segmentId: string) => {
      if (!seat.available) return;

      setSelectedSeats((prev) => {
        const next = new Map(prev);
        const existingKey = Array.from(next.entries()).find(
          ([, v]) => v.designator === seat.designator && v.segmentId === segmentId
        );

        if (existingKey) {
          next.delete(existingKey[0]);
          const remaining = Array.from(next.entries());
          const reindexed = new Map<string, SeatSelection>();
          remaining.forEach(([, v], i) => {
            reindexed.set(`pax-${i}`, v);
          });

          const nextPax = Math.min(reindexed.size, passengerCount - 1);
          setCurrentPassenger(nextPax);

          setTimeout(() => {
            onSeatSelected(Array.from(reindexed.values()));
          }, 0);

          return reindexed;
        }

        if (next.size >= passengerCount) return prev;

        const key = `pax-${currentPassenger}`;
        next.set(key, {
          segmentId,
          designator: seat.designator,
          serviceId: seat.serviceId,
          price: parseFloat(seat.price),
          currency: seat.currency,
        });

        const nextPax = Math.min(currentPassenger + 1, passengerCount - 1);
        if (next.size < passengerCount) {
          let candidate = nextPax;
          while (next.has(`pax-${candidate}`) && candidate < passengerCount) {
            candidate++;
          }
          if (candidate >= passengerCount) {
            candidate = 0;
            while (next.has(`pax-${candidate}`) && candidate < passengerCount) {
              candidate++;
            }
          }
          setCurrentPassenger(candidate < passengerCount ? candidate : nextPax);
        } else {
          setCurrentPassenger(nextPax);
        }

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plane className="h-4 w-4" />
            {t("seatmap.title") || "Seat Selection"}
          </CardTitle>
        </CardHeader>
        <CardContent>
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plane className="h-4 w-4" />
            {t("seatmap.title") || "Seat Selection"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-3 py-8 text-center" data-testid="seatmap-unavailable">
            <Info className="h-8 w-8 text-gray-400" />
            <p className="text-sm text-gray-500">
              {t("seatmap.unavailable") || "Seat map is not available for this flight. Seats will be assigned at check-in."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Plane className="h-4 w-4" />
          {t("seatmap.title") || "Seat Selection"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2" data-testid="seatmap-passenger-indicator">
          <Users className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-700">
            {t("seatmap.select_for") || "Select seat for"}{" "}
            {t("seatmap.passenger") || "Passenger"} {currentPassenger + 1} / {passengerCount}
          </span>
        </div>

        {selectedSeats.size > 0 && (
          <div className="flex flex-wrap gap-2">
            {Array.from(selectedSeats.entries()).map(([key, sel]) => (
              <Badge
                key={key}
                className="gap-1 bg-blue-100 text-blue-700 border-blue-200"
                data-testid={`badge-selected-seat-${sel.designator}`}
              >
                {t("seatmap.passenger") || "Passenger"} {parseInt(key.replace("pax-", "")) + 1}: {sel.designator}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSeats((prev) => {
                      const next = new Map(prev);
                      next.delete(key);
                      const remaining = Array.from(next.entries());
                      const reindexed = new Map<string, SeatSelection>();
                      remaining.forEach(([, v], i) => {
                        reindexed.set(`pax-${i}`, v);
                      });
                      setCurrentPassenger(Math.min(parseInt(key.replace("pax-", "")), passengerCount - 1));
                      setTimeout(() => {
                        onSeatSelected(Array.from(reindexed.values()));
                      }, 0);
                      return reindexed;
                    });
                  }}
                  data-testid={`button-remove-seat-${sel.designator}`}
                >
                  <XCircle className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {data.seatMaps.map((seatMap) => (
          <SeatMapGrid
            key={seatMap.segmentId}
            seatMap={seatMap}
            selectedSeats={selectedSeats}
            onSeatClick={handleSeatClick}
            t={t}
          />
        ))}

        <SeatLegend t={t} />

        {selectedSeats.size > 0 && (
          <div
            className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3"
            data-testid="seatmap-total-cost"
          >
            <span className="text-sm font-medium text-gray-700">
              {t("seatmap.total_seat_cost") || "Total seat cost"}
            </span>
            <span className="text-base font-bold text-blue-700">
              {currency} {totalSeatCost.toFixed(2)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
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
        <div className="relative rounded-t-[80px] border-x-2 border-t-2 border-gray-300 bg-gray-50 px-4 pt-10 pb-2">
          <div className="absolute left-1/2 top-3 -translate-x-1/2">
            <Plane className="h-5 w-5 text-gray-400 rotate-0" />
          </div>

          <div className="flex items-center justify-center gap-1 mb-3 px-2">
            <div className="flex gap-1 flex-1 justify-end">
              {LEFT_COLUMNS.map((col) => (
                <div key={col} className="w-9 text-center text-xs font-bold text-gray-500">
                  {col}
                </div>
              ))}
            </div>
            <div className="w-6" />
            <div className="flex gap-1 flex-1">
              {RIGHT_COLUMNS.map((col) => (
                <div key={col} className="w-9 text-center text-xs font-bold text-gray-500">
                  {col}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            {allRows.map((row) => (
              <div key={row.rowNumber} className="flex items-center justify-center gap-1 px-2">
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
                <div className="w-6 text-center text-[10px] font-medium text-gray-400 shrink-0">
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

        <div className="h-4 rounded-b-xl border-x-2 border-b-2 border-gray-300 bg-gray-50" />
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

  let className = "w-9 h-8 rounded-md text-[10px] font-medium transition-colors border-2 ";

  if (!seat.available) {
    className += "bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed";
  } else if (isSelected) {
    className += "bg-blue-600 border-blue-700 text-white cursor-pointer";
  } else if (extra) {
    className += "bg-white border-green-400 text-green-700 cursor-pointer hover:bg-green-50";
  } else {
    className += "bg-white border-blue-300 text-blue-600 cursor-pointer hover:bg-blue-50";
  }

  const priceLabel = seat.available
    ? `${seat.currency} ${parseFloat(seat.price).toFixed(2)}`
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
      <TooltipContent>
        <div className="text-xs space-y-0.5">
          <div className="font-bold">
            {t("seatmap.seat") || "Seat"} {seat.designator}
          </div>
          <div>{priceLabel}</div>
          {disclosureText && <div className="text-gray-400">{disclosureText}</div>}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function SeatLegend({ t }: { t: (key: string) => string }) {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-gray-600" data-testid="seatmap-legend">
      <div className="flex items-center gap-1.5">
        <div className="w-5 h-4 rounded border-2 border-blue-300 bg-white" />
        <span>{t("seatmap.available") || "Available"}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-5 h-4 rounded border-2 border-blue-700 bg-blue-600" />
        <span>{t("seatmap.selected") || "Selected"}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-5 h-4 rounded border-2 border-gray-300 bg-gray-200" />
        <span>{t("seatmap.unavailable_label") || "Unavailable"}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-5 h-4 rounded border-2 border-green-400 bg-white" />
        <span>{t("seatmap.extra_legroom") || "Extra legroom"}</span>
      </div>
    </div>
  );
}
