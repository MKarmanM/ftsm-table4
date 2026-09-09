// Official MQF-cluster-to-PLO legend (found on the Table 4 template,
// D42 in the blank form): "C1 = Knowledge & Understanding (HPP1),
// C2 = Cognitive Skills (HPP2), C3A = Practical Skills (HPP3),
// C3B = Interpersonal Skills (HPP4), C3C = Communication Skills (HPP5),
// C3D = Digital Skills (HPP6), C3E = Numeracy Skills (HPP7),
// C3F = Leadership, Autonomy & Responsibility (HPP8),
// C4A = Personal Skills (HPP9), C4B = Entrepreneurial Skills (HPP10),
// C5 = Ethics & Professionalism (HPP11)".
//
// Verified against a real filled sample: every MQF code that appeared
// in the "Mapping with MQF Cluster" grid matched exactly what this
// legend dictates for the PLO that CLO was mapped to (e.g. a CLO
// mapped to PLO2 always showed code "C2", never anything else). This
// means the MQF cluster is NOT independently chosen — it's fully
// determined by which PLO(s) a CLO maps to, so we derive it rather
// than ask the user to enter it.
export const PLO_NUMBER_TO_MQF_CODE: Record<number, string> = {
  1: "C1",
  2: "C2",
  3: "C3A",
  4: "C3B",
  5: "C3C",
  6: "C3D",
  7: "C3E",
  8: "C3F",
  9: "C4A",
  10: "C4B",
  11: "C5",
};

export const MQF_CODE_LABEL: Record<string, string> = {
  C1: "Knowledge & Understanding",
  C2: "Cognitive Skills",
  C3A: "Practical Skills",
  C3B: "Interpersonal Skills",
  C3C: "Communication Skills",
  C3D: "Digital Skills",
  C3E: "Numeracy Skills",
  C3F: "Leadership, Autonomy & Responsibility",
  C4A: "Personal Skills",
  C4B: "Entrepreneurial Skills",
  C5: "Ethics & Professionalism",
};

// Derives the MQF cluster code(s) for a CLO purely from which PLO
// number(s) it maps to — never stored, always computed, so it can
// never drift out of sync with the PLO mapping.
export function deriveMqfClusters(mappedPloNumbers: number[]): string[] {
  const codes = mappedPloNumbers
    .map((n) => PLO_NUMBER_TO_MQF_CODE[n])
    .filter((c): c is string => Boolean(c));
  return Array.from(new Set(codes));
}
