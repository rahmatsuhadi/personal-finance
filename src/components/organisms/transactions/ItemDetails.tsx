import { Trash2, Plus } from "lucide-react";
import { cn, formatRupiah } from "@/lib/utils";

interface ItemDetailsProps {
  useItemDetails: boolean;
  onUseItemDetailsChange: (val: boolean) => void;
  items: Array<{ name: string; price: string }>;
  onItemsChange: (items: Array<{ name: string; price: string }>) => void;
}

export function ItemDetails({
  useItemDetails,
  onUseItemDetailsChange,
  items,
  onItemsChange,
}: ItemDetailsProps) {
  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={() => {
          const nextVal = !useItemDetails;
          onUseItemDetailsChange(nextVal);
          if (nextVal && items.length === 0) {
            onItemsChange([{ name: "", price: "" }]);
          }
        }}
        className="flex items-center gap-3 self-start brutal-press"
      >
        <div
          className={cn(
            "w-10 h-6 border-2 border-brutal-black relative transition-colors duration-200",
            useItemDetails ? "bg-brutal-lime" : "bg-brutal-white"
          )}
        >
          <div
            className={cn(
              "absolute top-0.5 bottom-0.5 w-4 border-2 border-brutal-black bg-brutal-white transition-all duration-200",
              useItemDetails ? "left-4" : "left-0.5"
            )}
          />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-brutal-black">
          Gunakan Detail Barang
        </span>
      </button>

      {useItemDetails && (
        <div className="flex flex-col gap-3 pl-4 border-l-4 border-brutal-black mt-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <div className="flex-1 flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Nama barang..."
                  value={item.name}
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[idx].name = e.target.value;
                    onItemsChange(newItems);
                  }}
                  className="w-full border-2 border-brutal-black bg-brutal-white px-3 py-2 text-xs font-bold shadow-[2px_2px_0px_rgba(0,0,0,1)] outline-none focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px]"
                />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-brutal-black/50">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={item.price}
                    onChange={(e) => {
                      const newItems = [...items];
                      newItems[idx].price = formatRupiah(e.target.value);
                      onItemsChange(newItems);
                    }}
                    className="w-full border-2 border-brutal-black bg-brutal-white pl-8 pr-3 py-2 text-xs font-bold shadow-[2px_2px_0px_rgba(0,0,0,1)] outline-none focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px]"
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  const newItems = items.filter((_, i) => i !== idx);
                  onItemsChange(newItems);
                }}
                className="p-2 border-2 border-brutal-black bg-brutal-rose text-white shadow-[2px_2px_0px_rgba(0,0,0,1)] brutal-press mt-1 shrink-0"
              >
                <Trash2 size={16} strokeWidth={2.5} />
              </button>
            </div>
          ))}

          <button
            onClick={() => onItemsChange([...items, { name: "", price: "" }])}
            className="self-start flex items-center gap-2 mt-1 px-3 py-2 border-2 border-brutal-black bg-brutal-cyan shadow-[2px_2px_0px_rgba(0,0,0,1)] brutal-press text-xs font-bold uppercase tracking-wider"
          >
            <Plus size={14} strokeWidth={3} />
            Tambah Item
          </button>
        </div>
      )}
    </div>
  );
}
