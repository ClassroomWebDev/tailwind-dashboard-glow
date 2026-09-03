import type { EducationRow } from "@/lib/profile-meta";

export type CvReference = {
  name: string;
  designation: string;
  phone: string;
  email: string;
  relation: string;
};

export type CvData = {
  fullName: string;
  professionalTitle: string;
  autoId: string | null;
  email: string;
  mobile: string;
  altMobile: string;
  facebook: string;
  dateOfBirth: string;
  homeDistrict: string;
  presentAddress: string;
  permanentAddress: string;
  careerObjective: string;
  experience: string;
  education: EducationRow[];
  technicalSkills: string;
  softSkills: string;
  languages: string;
  fatherName: string;
  motherName: string;
  religion: string;
  bloodGroup: string;
  maritalStatus: string;
  nidNo: string;
  photoUrl: string | null;
  signatureUrl: string | null;
  signatureText: string | null;
  references: CvReference[];
};

const CV_FONT = "Calibri, 'Carlito', 'Segoe UI', Arial, sans-serif";

function fmtDate(value: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 border-b border-[#991B1B] pb-1 text-[11pt] font-bold uppercase tracking-[0.12em] text-[#991B1B]">
      {children}
    </h2>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="align-top">
      <th className="w-[40%] border border-slate-300 bg-slate-50 px-2 py-1 text-left font-semibold">
        {label}
      </th>
      <td className="border border-slate-300 px-2 py-1">{value || "—"}</td>
    </tr>
  );
}

export function CvDocument({ data }: { data: CvData }) {
  const skills = [
    { label: "Technical Skills", value: data.technicalSkills },
    { label: "Soft Skills", value: data.softSkills },
    { label: "Language", value: data.languages },
  ].filter((s) => s.value.trim());

  const experienceLines = data.experience
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div
      id="cv-print-area"
      className="mx-auto w-full max-w-[820px] bg-white p-8 text-[10pt] leading-relaxed text-slate-900 print:p-0"
      style={{ fontFamily: CV_FONT }}
    >
      <header className="flex items-start justify-between gap-6 border-b-2 border-[#991B1B] pb-4">
        <div>
          <h1
            className="text-[20pt] font-bold uppercase tracking-wide text-slate-900"
            style={{ fontFamily: CV_FONT }}
          >
            {data.fullName || "Your Name"}
          </h1>
          {data.professionalTitle ? (
            <p className="mt-0.5 text-[11pt] font-semibold text-[#991B1B]">{data.professionalTitle}</p>
          ) : null}
          <div className="mt-2 space-y-0.5 text-[9.5pt] text-slate-700">
            {data.presentAddress ? <p>{data.presentAddress}</p> : null}
            <p>
              Mobile: {data.mobile || "—"}
              {data.altMobile ? ` / ${data.altMobile}` : ""}
            </p>
            <p>Email: {data.email || "—"}</p>
            {data.facebook ? <p>Facebook: {data.facebook}</p> : null}
            {data.autoId ? <p>Member ID: {data.autoId}</p> : null}
          </div>
        </div>
        {data.photoUrl ? (
          <img
            src={data.photoUrl}
            alt={`${data.fullName} portrait`}
            className="h-[130px] w-[110px] shrink-0 border border-slate-300 object-cover"
          />
        ) : null}
      </header>

      {data.careerObjective ? (
        <section className="mt-5 break-inside-avoid">
          <Heading>Career Objective</Heading>
          <p className="whitespace-pre-line text-justify">{data.careerObjective}</p>
        </section>
      ) : null}

      {data.education.length > 0 ? (
        <section className="mt-5 break-inside-avoid">
          <Heading>Academic Qualifications</Heading>
          <table className="w-full border-collapse text-[9.5pt]">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 px-2 py-1 text-left">Degree / Exam</th>
                <th className="border border-slate-300 px-2 py-1 text-left">Institute / Board</th>
                <th className="border border-slate-300 px-2 py-1 text-left">Passing Year</th>
                <th className="border border-slate-300 px-2 py-1 text-left">CGPA / GPA</th>
              </tr>
            </thead>
            <tbody>
              {data.education.map((row, i) => (
                <tr key={`${row.degree}-${i}`}>
                  <td className="border border-slate-300 px-2 py-1">{row.degree || "—"}</td>
                  <td className="border border-slate-300 px-2 py-1">{row.institute || "—"}</td>
                  <td className="border border-slate-300 px-2 py-1">{row.year || "—"}</td>
                  <td className="border border-slate-300 px-2 py-1">{row.result || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {skills.length > 0 ? (
        <section className="mt-5 break-inside-avoid">
          <Heading>Skills &amp; Competencies</Heading>
          <ul className="space-y-1">
            {skills.map((s) => (
              <li key={s.label}>
                <span className="font-semibold">{s.label}: </span>
                {s.value}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {experienceLines.length > 0 ? (
        <section className="mt-5 break-inside-avoid">
          <Heading>Experience &amp; Activities</Heading>
          <ul className="list-disc space-y-1 pl-5">
            {experienceLines.map((line, i) => (
              <li key={`${line}-${i}`}>{line}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-5 break-inside-avoid">
        <Heading>Personal Details</Heading>
        <div className="grid grid-cols-2 gap-4 text-[9.5pt]">
          <table className="w-full border-collapse">
            <tbody>
              <InfoRow label="Father's Name" value={data.fatherName} />
              <InfoRow label="Mother's Name" value={data.motherName} />
              <InfoRow label="Date of Birth" value={fmtDate(data.dateOfBirth)} />
              <InfoRow label="Marital Status" value={data.maritalStatus} />
            </tbody>
          </table>
          <table className="w-full border-collapse">
            <tbody>
              <InfoRow label="Religion" value={data.religion} />
              <InfoRow label="Blood Group" value={data.bloodGroup} />
              <InfoRow label="Home District" value={data.homeDistrict} />
              <InfoRow label="NID / Smart Card" value={data.nidNo} />
            </tbody>
          </table>
        </div>
        {data.permanentAddress ? (
          <p className="mt-2">
            <span className="font-semibold">Permanent Address: </span>
            {data.permanentAddress}
          </p>
        ) : null}
      </section>

      {data.references.length > 0 ? (
        <section className="mt-5 break-inside-avoid">
          <Heading>References</Heading>
          <div className="grid grid-cols-2 gap-4 text-[9.5pt]">
            {data.references.map((ref, i) => (
              <div key={`${ref.name}-${i}`} className="border border-slate-300 px-3 py-2">
                <p className="font-semibold">{ref.name}</p>
                {ref.designation ? <p>{ref.designation}</p> : null}
                {ref.phone ? <p>Phone: {ref.phone}</p> : null}
                {ref.email ? <p>Email: {ref.email}</p> : null}
                {ref.relation ? <p>Relation: {ref.relation}</p> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8 flex items-end justify-between break-inside-avoid">
        <p className="max-w-[55%] text-[9pt] text-slate-600">
          I hereby declare that the information stated above is true to the best of my knowledge.
        </p>
        <div className="text-center">
          {data.signatureUrl ? (
            <img
              src={data.signatureUrl}
              alt="Digital signature"
              className="mx-auto h-[52px] object-contain"
            />
          ) : data.signatureText ? (
            <p
              className="h-[52px] text-[18pt] italic leading-[52px]"
              style={{ fontFamily: "'Brush Script MT', cursive" }}
            >
              {data.signatureText}
            </p>
          ) : (
            <div className="h-[52px]" />
          )}
          <div className="w-[190px] border-t border-slate-500 pt-1 text-[9.5pt] font-semibold">
            {data.fullName || "Signature"}
          </div>
        </div>
      </section>
    </div>
  );
}
