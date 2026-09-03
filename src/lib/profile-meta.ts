export const BD_DISTRICTS = [
  "Bagerhat","Bandarban","Barguna","Barishal","Bhola","Bogura","Brahmanbaria","Chandpur",
  "Chapai Nawabganj","Chattogram","Chuadanga","Cox's Bazar","Cumilla","Dhaka","Dinajpur",
  "Faridpur","Feni","Gaibandha","Gazipur","Gopalganj","Habiganj","Jamalpur","Jashore",
  "Jhalokati","Jhenaidah","Joypurhat","Khagrachhari","Khulna","Kishoreganj","Kurigram",
  "Kushtia","Lakshmipur","Lalmonirhat","Madaripur","Magura","Manikganj","Meherpur",
  "Moulvibazar","Munshiganj","Mymensingh","Naogaon","Narail","Narayanganj","Narsingdi",
  "Natore","Netrokona","Nilphamari","Noakhali","Pabna","Panchagarh","Patuakhali","Pirojpur",
  "Rajbari","Rajshahi","Rangamati","Rangpur","Satkhira","Shariatpur","Sherpur","Sirajganj",
  "Sunamganj","Sylhet","Tangail","Thakurgaon",
] as const;

export const RELIGIONS = ["Islam", "Hinduism", "Christianity", "Buddhism", "Others"] as const;

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const;

export const MARITAL_STATUSES = ["Single", "Married", "Divorced", "Widowed"] as const;

/** Mandatory core — 60% of the score, 10% each. */
export const MANDATORY_FIELDS = [
  "full_name",
  "mobile",
  "email",
  "facebook_link",
  "date_of_birth",
  "home_district",
] as const;

export const OPTIONAL_FIELDS = [
  "photo_url",
  "career_objective",
  "education",
  "skills",
  "personal_info",
  "signature_url",
] as const;

export const FIELD_LABELS = {
  full_name: "Full Name",
  mobile: "Mobile Number",
  email: "Email Address",
  facebook_link: "Facebook Profile Link",
  date_of_birth: "Date of Birth",
  home_district: "Home District",
  photo_url: "Profile Photo",
  career_objective: "Career Objective",
  education: "Academic Qualifications",
  skills: "Skills & Competencies",
  personal_info: "Personal Details",
  signature_url: "Digital Signature",
  professional_title: "Professional Title",
  present_address: "Present Address",
  permanent_address: "Permanent Address",
  technical_skills: "Technical Skills",
  soft_skills: "Soft Skills",
  languages: "Languages",
  father_name: "Father's Name",
  mother_name: "Mother's Name",
  religion: "Religion",
  blood_group: "Blood Group",
  marital_status: "Marital Status",
  nid_no: "NID / Smart Card No",
  institution: "Institution",
  address: "Address",
} as const satisfies Record<string, string>;

export type EducationRow = {
  degree: string;
  institute: string;
  year: string;
  result: string;
};

export const EMPTY_EDUCATION_ROW: EducationRow = {
  degree: "",
  institute: "",
  year: "",
  result: "",
};

export function parseEducation(value: unknown): EducationRow[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((row): row is Record<string, unknown> => !!row && typeof row === "object")
    .map((row) => ({
      degree: String(row["degree"] ?? ""),
      institute: String(row["institute"] ?? ""),
      year: String(row["year"] ?? ""),
      result: String(row["result"] ?? ""),
    }));
}

export function hasEducation(value: unknown) {
  return parseEducation(value).some((r) => r.degree.trim() || r.institute.trim());
}

const filled = (value: unknown) =>
  typeof value === "string" ? value.trim().length > 0 : value != null;

const OPTIONAL_WEIGHTS: Record<(typeof OPTIONAL_FIELDS)[number], number> = {
  photo_url: 10,
  career_objective: 5,
  education: 10,
  skills: 5,
  personal_info: 5,
  signature_url: 5,
};

const PERSONAL_INFO_FIELDS = [
  "father_name",
  "mother_name",
  "religion",
  "blood_group",
  "marital_status",
  "nid_no",
] as const;

/**
 * Mandatory core carries 60% (10% per field); optional CV sections carry the
 * remaining 40% (photo 10, objective 5, education 10, skills 5, personal 5, signature 5).
 */
export function profileCompletion(values: Record<string, unknown>) {
  const mandatoryDone = MANDATORY_FIELDS.filter((f) => filled(values[f])).length;

  const optionalStatus: Record<(typeof OPTIONAL_FIELDS)[number], boolean> = {
    photo_url: filled(values["photo_url"]),
    career_objective: filled(values["career_objective"]),
    education: hasEducation(values["education"]),
    skills:
      filled(values["technical_skills"]) ||
      filled(values["soft_skills"]) ||
      filled(values["languages"]),
    personal_info: PERSONAL_INFO_FIELDS.every((f) => filled(values[f])),
    signature_url: filled(values["signature_url"]),
  };

  const optionalDone = OPTIONAL_FIELDS.filter((f) => optionalStatus[f]).length;
  const mandatoryPct = mandatoryDone * 10;
  const optionalPct = OPTIONAL_FIELDS.reduce(
    (acc, f) => acc + (optionalStatus[f] ? OPTIONAL_WEIGHTS[f] : 0),
    0,
  );
  const percent = Math.min(100, Math.round(mandatoryPct + optionalPct));

  return {
    percent,
    mandatoryDone,
    mandatoryTotal: MANDATORY_FIELDS.length,
    optionalDone,
    optionalTotal: OPTIONAL_FIELDS.length,
    optionalStatus,
    missingMandatory: MANDATORY_FIELDS.filter((f) => !filled(values[f])),
  };
}

export type CompletionTone = "amber" | "blue" | "green";

export function completionStatus(percent: number): { tone: CompletionTone; label: string } {
  if (percent >= 100) return { tone: "green", label: "🎉 100% Profile Completed" };
  if (percent >= 60) return { tone: "blue", label: "Add CV details to reach 100%" };
  return { tone: "amber", label: "Complete all mandatory fields" };
}

/** True when today's day + month match the given ISO date of birth. */
export function isBirthdayToday(dateOfBirth: string | null | undefined, now = new Date()) {
  if (!dateOfBirth) return false;
  const parts = dateOfBirth.slice(0, 10).split("-");
  if (parts.length < 3) return false;
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!month || !day) return false;
  return now.getMonth() + 1 === month && now.getDate() === day;
}
