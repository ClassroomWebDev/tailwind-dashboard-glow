import { useEffect, useState } from "react";
import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveAssetUrl, type Certificate, type CertificateTemplate } from "@/hooks/useCertificates";
import { formatDate } from "@/lib/format";

export type CertificateData = {
  certificate: Certificate;
  template: CertificateTemplate | null;
  memberName: string;
  courseName: string;
};

/** A4-landscape certificate rendered over the admin-uploaded template, ready for high-res print/PDF. */
export function CertificateDocument({ data, onClose }: { data: CertificateData; onClose: () => void }) {
  const { certificate, template, memberName, courseName } = data;
  const [bg, setBg] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const [b, s] = await Promise.all([
        resolveAssetUrl(template?.image_url ?? null),
        resolveAssetUrl(template?.signature_url ?? null),
      ]);
      if (!alive) return;
      setBg(b);
      setSignature(s);
    })();
    return () => {
      alive = false;
    };
  }, [template?.image_url, template?.signature_url]);

  const issued = certificate.issued_at ?? new Date().toISOString();

  /** The browser names the saved PDF after document.title, so swap it for the print only. */
  function download() {
    const previous = document.title;
    document.title = `${memberName} - ${courseName}`;
    window.print();
    window.setTimeout(() => {
      document.title = previous;
    }, 500);
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4 print:static print:bg-white print:p-0">
      <div className="mx-auto max-w-5xl">
        <div className="mb-3 flex justify-end gap-2 print:hidden">
          <Button size="sm" onClick={download}>
            <Printer className="size-3.5" /> Download PDF
          </Button>
          <Button size="sm" variant="secondary" onClick={onClose}>
            <X className="size-3.5" /> Close
          </Button>
        </div>

        <div id="print-area" className="print-certificate mx-auto bg-white shadow-2xl print:shadow-none">
          <div
            className="relative flex aspect-[297/210] w-full flex-col items-center justify-center px-16 text-center"
            style={
              bg
                ? { backgroundImage: `url(${bg})`, backgroundSize: "cover", backgroundPosition: "center" }
                : { border: "10px double #991B1B" }
            }
          >
            {!bg ? (
              <>
                <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#991B1B]">Classroom Bangladesh</p>
                <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900">Certificate of Completion</h1>
              </>
            ) : null}

            <p className="mt-8 text-sm uppercase tracking-[0.2em] text-slate-600">This is to certify that</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{memberName}</p>
            <p className="mt-3 max-w-2xl text-sm text-slate-700">
              has successfully completed all scheduled classes of the course
            </p>
            <p className="mt-2 text-xl font-bold text-[#991B1B]">{courseName}</p>

            <div className="mt-10 flex w-full items-end justify-between text-left text-xs text-slate-700">
              <div>
                <p className="font-semibold">Serial No</p>
                <p>{certificate.serial_no ?? "—"}</p>
                <p className="mt-2 font-semibold">Issue Date</p>
                <p>{formatDate(issued)}</p>
              </div>
              <div className="text-center">
                {signature ? (
                  <img src={signature} alt="Authority signature" className="mx-auto h-12 object-contain" />
                ) : (
                  <div className="h-12" />
                )}
                <div className="mt-1 w-48 border-t border-slate-500 pt-1 font-semibold">
                  {template?.authority_name ?? "Authorised Signatory"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
