import PoDocument from "@/app/rfq/[id]/po/[quoteId]/PoDocument";

export const dynamic = "force-dynamic";

export default function NewCustomPO() {
  const year = new Date().getFullYear();
  const poNo = `${year}-${(year + 1) % 100}/${String(Date.now()).slice(-3)}`;
  const date = new Date().toLocaleDateString("en-GB");
  return (
    <PoDocument
      poNo={poNo}
      date={date}
      supplier={{ name: "", contact: "" }}
      reference=""
      rows={[]}
    />
  );
}
