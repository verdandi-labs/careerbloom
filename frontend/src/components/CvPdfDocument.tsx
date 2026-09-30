import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import type {
  CVTemplateId,
  StructuredCVData,
  SectionOrderItem,
} from "@/lib/cv-templates";
import { orderedSections, splitAtPageBreaks } from "@/lib/cv-templates";

function groupHasContent(keys: string[], data: StructuredCVData): boolean {
  return keys.some((key) => {
    switch (key) {
      case "experience":
        return Array.isArray(data.experience) && data.experience.length > 0;
      case "education":
        return Array.isArray(data.education) && data.education.length > 0;
      case "skills":
        return Array.isArray(data.skills) && data.skills.length > 0;
      case "languages":
        return Array.isArray(data.languages) && data.languages.length > 0;
      case "contact":
        return Array.isArray(data.contact) && data.contact.length > 0;
      case "awards":
        return Array.isArray(data.awards) && data.awards.length > 0;
      case "publications":
        return Array.isArray(data.publications) && data.publications.length > 0;
      case "volunteer":
        return Array.isArray(data.volunteer) && data.volunteer.length > 0;
      case "projects":
        return Array.isArray(data.projects) && data.projects.length > 0;
      case "references":
        return (
          typeof data.references === "string" &&
          data.references.trim().length > 0
        );
      case "certifications":
        return (
          typeof data.certifications === "string" &&
          data.certifications.trim().length > 0
        );
      case "other":
        return typeof data.other === "string" && data.other.trim().length > 0;
      case "summary":
        return (
          typeof data.summary === "string" && data.summary.trim().length > 0
        );
      default:
        return false;
    }
  });
}

const TERRACOTTA = "#CB6843";
const TERRACOTTA_LIGHT = "#FDE8E8";
const SAGE = "#7B9E87";
const SAGE_LIGHT = "#EAF0EC";
const SAGE_MID = "#C5D8CB";
const MUTED = "#9b8b86";
const INK = "#1c1410";
const CLASSIC_INK = "#111";
const CLASSIC_MUTED = "#666";
const CLASSIC_RULE = "#d0c8c4";
const BOLD_INK = "#111";
const BOLD_MUTED = "#555";
const BOLD_BG = "#E8E5DC";
const MINIMAL_INK = "#111";
const MINIMAL_MUTED = "#666";
const MINIMAL_LIGHT = "#f5f5f5";

function TerracottaPdfDocument({
  data,
  sectionOrder,
  pdfScale = 1.0,
}: {
  data: StructuredCVData;
  sectionOrder?: SectionOrderItem[];
  pdfScale?: number;
}) {
  const sidebarKeys = orderedSections(sectionOrder, [
    "contact",
    "skills",
    "languages",
    "education",
  ]);
  const mainKeys = orderedSections(sectionOrder, [
    "experience",
    "awards",
    "publications",
    "volunteer",
    "projects",
  ]);
  const pageGroups = splitAtPageBreaks(sectionOrder, [
    ...sidebarKeys,
    ...mainKeys,
  ]);

  const sc = 0.75 * pdfScale;

  const styles = StyleSheet.create({
    page: {
      fontFamily: "DM Sans",
      backgroundColor: "#ffffff",
      flexDirection: "row",
    },
    sidebar: {
      width: 150,
      padding: 20,
      borderRightWidth: 1,
      borderRightColor: TERRACOTTA,
      borderRightStyle: "solid",
      flexDirection: "column",
      gap: 20,
    },
    main: {
      flex: 1,
      padding: 24,
      flexDirection: "column",
      gap: 20,
    },
    sidebarLabel: {
      fontSize: 7.5 * sc,
      textTransform: "uppercase",
      letterSpacing: 1.5,
      color: TERRACOTTA,
      marginBottom: 6,
      fontWeight: 700,
    },
    contactItem: {
      fontSize: 9 * sc,
      color: MUTED,
      lineHeight: 1.5,
      marginBottom: 2,
    },
    skillPill: {
      fontSize: 7.5 * sc,
      color: TERRACOTTA,
      backgroundColor: TERRACOTTA_LIGHT,
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 4,
      marginRight: 4,
      marginBottom: 4,
    },
    skillsWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    languageRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 3,
    },
    languageName: {
      fontSize: 9 * sc,
      color: INK,
    },
    languageLevel: {
      fontSize: 9 * sc,
      color: MUTED,
    },
    eduCenter: {
      fontSize: 9 * sc,
      fontWeight: 500,
      color: INK,
      marginBottom: 1,
    },
    eduSub: {
      fontSize: 7.5 * sc,
      color: MUTED,
      marginBottom: 1,
    },
    name: {
      fontFamily: "Playfair Display",
      fontSize: 27 * sc,
      fontWeight: 700,
      color: INK,
      marginBottom: 4,
    },
    jobTitle: {
      fontSize: 10.5 * sc,
      color: TERRACOTTA,
      marginBottom: 6,
    },
    summary: {
      fontSize: 9 * sc,
      color: MUTED,
      lineHeight: 1.6,
      maxWidth: 240,
    },
    divider: {
      height: 1,
      backgroundColor: TERRACOTTA,
      marginVertical: 4,
    },
    experienceSection: {
      flexDirection: "column",
      gap: 14,
    },
    experienceItem: {
      marginBottom: 4,
    },
    expHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 2,
    },
    expCompany: {
      fontFamily: "Playfair Display",
      fontSize: 10.5 * sc,
      fontWeight: 700,
      color: INK,
    },
    expCity: {
      fontSize: 7.5 * sc,
      color: TERRACOTTA,
      marginTop: 1,
    },
    dateBadge: {
      fontSize: 7.5 * sc,
      color: MUTED,
      backgroundColor: TERRACOTTA_LIGHT,
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 4,
    },
    expComments: {
      fontSize: 9 * sc,
      color: MUTED,
      lineHeight: 1.5,
    },
    sectionBlock: {
      marginBottom: 4,
    },
  });

  function renderSidebarSection(key: string) {
    if (key === "contact" && data.contact.length > 0) {
      return (
        <View key="contact" style={styles.sectionBlock}>
          <Text style={styles.sidebarLabel}>Contact</Text>
          {data.contact.map((item, i) => (
            <Text key={i} style={styles.contactItem}>
              {item.detail}
            </Text>
          ))}
        </View>
      );
    }
    if (key === "skills" && data.skills.length > 0) {
      return (
        <View key="skills" style={styles.sectionBlock}>
          <Text style={styles.sidebarLabel}>Skills</Text>
          <View style={styles.skillsWrap}>
            {data.skills.map((item, i) => (
              <Text key={i} style={styles.skillPill}>
                {item.skill}
              </Text>
            ))}
          </View>
        </View>
      );
    }
    if (key === "languages" && data.languages.length > 0) {
      return (
        <View key="languages" style={styles.sectionBlock}>
          <Text style={styles.sidebarLabel}>Languages</Text>
          {data.languages.map((item, i) => (
            <View key={i} style={styles.languageRow}>
              <Text style={styles.languageName}>{item.language}</Text>
              {item.level && (
                <Text style={styles.languageLevel}>{item.level}</Text>
              )}
            </View>
          ))}
        </View>
      );
    }
    if (key === "education" && data.education.length > 0) {
      return (
        <View key="education" style={styles.sectionBlock}>
          <Text style={styles.sidebarLabel}>Education</Text>
          {data.education.map((item, i) => (
            <View key={i} style={{ marginBottom: 6 }}>
              <Text style={styles.eduCenter}>{item.edu_center}</Text>
              <Text style={styles.eduSub}>
                {[item.city, item.end_date ?? item.start_date]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
              {item.comments && (
                <Text style={styles.eduSub}>{item.comments}</Text>
              )}
            </View>
          ))}
        </View>
      );
    }
    return null;
  }

  function renderMainSection(key: string) {
    if (key === "experience" && data.experience.length > 0) {
      return (
        <View key="experience">
          <Text style={styles.sidebarLabel}>Experience</Text>
          <View style={styles.experienceSection}>
            {data.experience.map((item, i) => (
              <View key={i} style={styles.experienceItem}>
                <View style={styles.expHeader}>
                  <View>
                    <Text style={styles.expCompany}>
                      {item.title ?? item.company}
                    </Text>
                    {item.title && item.company && (
                      <Text style={styles.expCity}>{item.company}</Text>
                    )}
                    {item.city && (
                      <Text style={styles.expCity}>{item.city}</Text>
                    )}
                  </View>
                  {(item.start_date || item.end_date) && (
                    <Text style={styles.dateBadge}>
                      {item.start_date && item.end_date
                        ? `${item.start_date} – ${item.end_date}`
                        : (item.start_date ?? item.end_date)}
                    </Text>
                  )}
                </View>
                {item.comments && (
                  <Text style={styles.expComments}>{item.comments}</Text>
                )}
              </View>
            ))}
          </View>
        </View>
      );
    }
    return null;
  }

  return (
    <Document>
      {pageGroups.map((pageKeys, gi) => {
        if (!groupHasContent(pageKeys, data)) return null;
        const pageSidebarKeys = pageKeys.filter((k) => sidebarKeys.includes(k));
        const pageMainKeys = pageKeys.filter((k) => mainKeys.includes(k));
        return (
          <Page key={gi} size="A4" style={styles.page}>
            <View style={styles.sidebar}>
              {gi === 0 && (
                <View
                  style={{
                    width: "100%",
                    height: 120,
                    marginBottom: 12,
                    backgroundColor: "#F5E6DF",
                    borderRadius: 3,
                  }}
                >
                  {data.photo ? (
                    <Image
                      src={data.photo}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: 4,
                      }}
                    />
                  ) : (
                    <View
                      style={{
                        width: "100%",
                        height: "100%",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: "#CB6843",
                          opacity: 0.3,
                        }}
                      />
                    </View>
                  )}
                </View>
              )}
              {pageSidebarKeys.map((key) => renderSidebarSection(key))}
            </View>
            <View style={styles.main}>
              {gi === 0 && data.name && (
                <View>
                  <Text style={styles.name}>{data.name}</Text>
                  {data.title && (
                    <Text style={styles.jobTitle}>{data.title}</Text>
                  )}
                  {data.summary && (
                    <Text style={styles.summary}>{data.summary}</Text>
                  )}
                </View>
              )}
              {gi === 0 && <View style={styles.divider} />}
              {pageMainKeys.map((key) => renderMainSection(key))}
            </View>
          </Page>
        );
      })}
    </Document>
  );
}

function SagePdfDocument({
  data,
  sectionOrder,
  pdfScale = 1.0,
}: {
  data: StructuredCVData;
  sectionOrder?: SectionOrderItem[];
  pdfScale?: number;
}) {
  const contactText = data.contact
    .map((c) => c.detail)
    .filter(Boolean)
    .join(" · ");

  const sidebarKeys = orderedSections(sectionOrder, ["skills", "languages"]);
  const mainKeys = orderedSections(sectionOrder, ["experience", "education"]);
  const pageGroups = splitAtPageBreaks(sectionOrder, [
    ...sidebarKeys,
    ...mainKeys,
  ]);

  const sc = 0.75 * pdfScale;

  const styles = StyleSheet.create({
    page: {
      fontFamily: "DM Sans",
      backgroundColor: "#ffffff",
      flexDirection: "column",
    },
    header: {
      paddingHorizontal: 32,
      paddingTop: 32,
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: SAGE_LIGHT,
      borderBottomStyle: "solid",
    },
    cvLabel: {
      fontSize: 6.75 * sc,
      textTransform: "uppercase",
      letterSpacing: 1.5,
      color: SAGE,
      marginBottom: 8,
    },
    name: {
      fontFamily: "Playfair Display",
      fontSize: 36 * sc,
      fontWeight: 700,
      color: INK,
      marginBottom: 4,
    },
    contactLine: {
      fontSize: 7.5 * sc,
      color: MUTED,
      marginBottom: 10,
    },
    summaryBox: {
      backgroundColor: SAGE_LIGHT,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 4,
    },
    summaryText: {
      fontSize: 9 * sc,
      lineHeight: 1.6,
      color: "#4a4a4a",
    },
    body: {
      flex: 1,
      flexDirection: "row",
    },
    mainCol: {
      flex: 1,
      padding: 20,
      paddingRight: 24,
    },
    sideCol: {
      width: 150,
      padding: 32,
      paddingLeft: 24,
      borderLeftWidth: 1,
      borderLeftColor: SAGE_LIGHT,
      borderLeftStyle: "solid",
    },
    sectionLabel: {
      fontSize: 6.75 * sc,
      textTransform: "uppercase",
      letterSpacing: 1.35,
      color: SAGE,
      fontWeight: 700,
      marginBottom: 4,
    },
    sectionRule: {
      height: 1,
      backgroundColor: SAGE_MID,
      marginBottom: 10,
    },
    expCompany: {
      fontFamily: "Playfair Display",
      fontSize: 10.5 * sc,
      fontWeight: 700,
      color: INK,
    },
    expCity: {
      fontSize: 7.5 * sc,
      color: SAGE,
      marginTop: 1,
    },
    dateBadge: {
      fontSize: 6.75 * sc,
      color: SAGE,
      backgroundColor: SAGE_LIGHT,
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 9999,
    },
    expComments: {
      fontSize: 8.25 * sc,
      color: MUTED,
      lineHeight: 1.5,
      marginTop: 2,
    },
    experienceItem: {
      marginBottom: 8,
    },
    expHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 2,
    },
    eduCenter: {
      fontFamily: "Playfair Display",
      fontSize: 10.5 * sc,
      fontWeight: 700,
      color: INK,
    },
    eduSub: {
      fontSize: 7.5 * sc,
      color: MUTED,
      marginBottom: 1,
    },
    skillItem: {
      fontSize: 9 * sc,
      color: INK,
      marginBottom: 2,
    },
    languageRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 3,
    },
    languageName: {
      fontSize: 9 * sc,
      color: INK,
    },
    languageLevel: {
      fontSize: 9 * sc,
      color: MUTED,
    },
    sectionBlock: {
      marginBottom: 20,
    },
  });

  function renderSidebarSection(key: string) {
    if (key === "skills" && data.skills.length > 0) {
      return (
        <View key="skills" style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>Skills</Text>
          <View style={styles.sectionRule} />
          {data.skills.map((item, i) => (
            <Text key={i} style={styles.skillItem}>
              {item.skill}
            </Text>
          ))}
        </View>
      );
    }
    if (key === "languages" && data.languages.length > 0) {
      return (
        <View key="languages" style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>Languages</Text>
          <View style={styles.sectionRule} />
          {data.languages.map((item, i) => (
            <View key={i} style={styles.languageRow}>
              <Text style={styles.languageName}>{item.language}</Text>
              {item.level && (
                <Text style={styles.languageLevel}>{item.level}</Text>
              )}
            </View>
          ))}
        </View>
      );
    }
    return null;
  }

  function renderMainSection(key: string) {
    if (key === "experience" && data.experience.length > 0) {
      return (
        <View key="experience" style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>Experience</Text>
          <View style={styles.sectionRule} />
          {data.experience.map((item, i) => (
            <View key={i} style={styles.experienceItem}>
              <View style={styles.expHeader}>
                <View>
                  <Text style={styles.expCompany}>
                    {item.title ?? item.company}
                  </Text>
                  {item.title && item.company && (
                    <Text style={styles.expCity}>{item.company}</Text>
                  )}
                  {item.city && <Text style={styles.expCity}>{item.city}</Text>}
                </View>
                {(item.start_date || item.end_date) && (
                  <Text style={styles.dateBadge}>
                    {item.start_date && item.end_date
                      ? `${item.start_date} – ${item.end_date}`
                      : (item.start_date ?? item.end_date)}
                  </Text>
                )}
              </View>
              {item.comments && (
                <Text style={styles.expComments}>{item.comments}</Text>
              )}
            </View>
          ))}
        </View>
      );
    }
    if (key === "education" && data.education.length > 0) {
      return (
        <View key="education" style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>Education</Text>
          <View style={styles.sectionRule} />
          {data.education.map((item, i) => (
            <View key={i} style={styles.experienceItem}>
              <View style={styles.expHeader}>
                <View>
                  <Text style={styles.eduCenter}>{item.edu_center}</Text>
                  {item.city && <Text style={styles.eduSub}>{item.city}</Text>}
                </View>
                {(item.start_date || item.end_date) && (
                  <Text style={styles.dateBadge}>
                    {item.start_date && item.end_date
                      ? `${item.start_date} – ${item.end_date}`
                      : (item.start_date ?? item.end_date)}
                  </Text>
                )}
              </View>
              {item.comments && (
                <Text style={styles.expComments}>{item.comments}</Text>
              )}
            </View>
          ))}
        </View>
      );
    }
    return null;
  }

  return (
    <Document>
      {pageGroups.map((pageKeys, gi) => {
        if (!groupHasContent(pageKeys, data)) return null;
        const pageSidebarKeys = pageKeys.filter((k) => sidebarKeys.includes(k));
        const pageMainKeys = pageKeys.filter((k) => mainKeys.includes(k));
        return (
          <Page key={gi} size="A4" style={styles.page}>
            {gi === 0 && (
              <View style={styles.header}>
                <Text style={styles.cvLabel}>Curriculum Vitae</Text>
                {data.name && <Text style={styles.name}>{data.name}</Text>}
                <Text style={styles.contactLine}>
                  {data.title ? `${data.title}${contactText ? " · " : ""}` : ""}
                  {contactText}
                </Text>
                {data.summary && (
                  <View style={styles.summaryBox}>
                    <Text style={styles.summaryText}>{data.summary}</Text>
                  </View>
                )}
              </View>
            )}
            <View style={styles.body}>
              <View style={styles.mainCol}>
                {pageMainKeys.map((key) => renderMainSection(key))}
              </View>
              <View style={styles.sideCol}>
                {gi === 0 && (
                  <View
                    style={{
                      width: "100%",
                      height: 120,
                      marginBottom: 20,
                      backgroundColor: "#EAF0EC",
                      borderRadius: 3,
                    }}
                  >
                    {data.photo ? (
                      <Image
                        src={data.photo}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <View
                        style={{
                          width: "100%",
                          height: "100%",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <View
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            backgroundColor: "#7B9E87",
                            opacity: 0.3,
                          }}
                        />
                      </View>
                    )}
                  </View>
                )}
                {pageSidebarKeys.map((key) => renderSidebarSection(key))}
              </View>
            </View>
          </Page>
        );
      })}
    </Document>
  );
}

function ClassicPdfDocument({
  data,
  sectionOrder,
  pdfScale = 1.0,
}: {
  data: StructuredCVData;
  sectionOrder?: SectionOrderItem[];
  pdfScale?: number;
}) {
  const contactText = data.contact
    .map((c) => c.detail)
    .filter(Boolean)
    .join(" · ");

  const allKeys = orderedSections(sectionOrder, [
    "experience",
    "education",
    "skills",
    "languages",
  ]);
  const groups = splitAtPageBreaks(sectionOrder, allKeys);

  const sc = 0.75 * pdfScale;

  const styles = StyleSheet.create({
    page: {
      fontFamily: "DM Sans",
      backgroundColor: "#ffffff",
      paddingHorizontal: 48,
      paddingTop: 30,
      paddingBottom: 40,
      flexDirection: "column",
    },
    name: {
      fontFamily: "Playfair Display",
      fontSize: 36 * sc,
      fontWeight: 700,
      color: CLASSIC_INK,
      textAlign: "center",
      marginBottom: 6,
    },
    contactLine: {
      fontSize: 9 * sc,
      color: CLASSIC_MUTED,
      textAlign: "center",
      letterSpacing: 1.5,
      textTransform: "uppercase",
      marginBottom: 16,
    },
    rule: {
      height: 1,
      backgroundColor: CLASSIC_RULE,
      marginVertical: 16,
    },
    sectionLabel: {
      fontFamily: "Playfair Display",
      fontSize: 9 * sc,
      textTransform: "uppercase",
      letterSpacing: 2,
      color: CLASSIC_INK,
      fontWeight: 600,
      marginBottom: 12,
    },
    summaryText: {
      fontSize: 9 * sc,
      lineHeight: 1.6,
      color: CLASSIC_MUTED,
    },
    expRole: {
      fontFamily: "Playfair Display",
      fontSize: 10.5 * sc,
      fontWeight: 700,
      color: CLASSIC_INK,
    },
    expDate: {
      fontSize: 7.5 * sc,
      color: CLASSIC_MUTED,
    },
    expCompany: {
      fontSize: 7.5 * sc,
      fontStyle: "normal",
      color: CLASSIC_MUTED,
      marginBottom: 2,
    },
    expComment: {
      fontSize: 8.25 * sc,
      color: CLASSIC_MUTED,
      lineHeight: 1.5,
    },
    bottomRow: {
      flexDirection: "row",
      gap: 32,
    },
    bottomCol: {
      flex: 1,
    },
    skillText: {
      fontSize: 8.25 * sc,
      color: CLASSIC_MUTED,
      lineHeight: 1.6,
    },
    languageRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 3,
    },
    languageName: {
      fontSize: 9 * sc,
      color: CLASSIC_INK,
    },
    languageLevel: {
      fontSize: 9 * sc,
      color: CLASSIC_MUTED,
    },
  });

  function renderSection(key: string) {
    if (key === "experience" && data.experience.length > 0) {
      return (
        <View key="experience" style={{ marginBottom: 20 }}>
          <Text style={styles.sectionLabel}>Experience</Text>
          {data.experience.map((item, i) => (
            <View key={i} style={{ marginBottom: 16 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 2,
                }}
              >
                <Text style={styles.expRole}>{item.title ?? item.company}</Text>
                {(item.start_date || item.end_date) && (
                  <Text style={styles.expDate}>
                    {item.start_date && item.end_date
                      ? `${item.start_date} – ${item.end_date}`
                      : (item.start_date ?? item.end_date)}
                  </Text>
                )}
              </View>
              {item.title && item.company && (
                <Text style={styles.expCompany}>{item.company}</Text>
              )}
              {item.city && <Text style={styles.expCompany}>{item.city}</Text>}
              {item.comments && (
                <Text style={styles.expComment}>{item.comments}</Text>
              )}
            </View>
          ))}
        </View>
      );
    }
    if (key === "education" && data.education.length > 0) {
      return (
        <View key="education" style={{ marginBottom: 20 }}>
          <Text style={styles.sectionLabel}>Education</Text>
          {data.education.map((item, i) => (
            <View key={i} style={{ marginBottom: 16 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 2,
                }}
              >
                <Text style={styles.expRole}>{item.edu_center}</Text>
                {(item.start_date || item.end_date) && (
                  <Text style={styles.expDate}>
                    {item.start_date && item.end_date
                      ? `${item.start_date} – ${item.end_date}`
                      : (item.start_date ?? item.end_date)}
                  </Text>
                )}
              </View>
              {item.city && <Text style={styles.expCompany}>{item.city}</Text>}
            </View>
          ))}
        </View>
      );
    }
    if (key === "skills" && data.skills.length > 0) {
      return (
        <View key="skills">
          <Text style={styles.sectionLabel}>Skills</Text>
          <Text style={styles.skillText}>
            {data.skills
              .map((item) => item.skill)
              .filter(Boolean)
              .join(", ")}
          </Text>
        </View>
      );
    }
    if (key === "languages" && data.languages.length > 0) {
      return (
        <View key="languages">
          <Text style={styles.sectionLabel}>Languages</Text>
          {data.languages.map((item, i) => (
            <View key={i} style={styles.languageRow}>
              <Text style={styles.languageName}>{item.language}</Text>
              {item.level && (
                <Text style={styles.languageLevel}>{item.level}</Text>
              )}
            </View>
          ))}
        </View>
      );
    }
    return null;
  }

  return (
    <Document>
      {groups.map((group, gi) => {
        if (!groupHasContent(group, data)) return null;
        return (
          <Page key={gi} size="A4" style={styles.page}>
            {gi === 0 && (
              <>
                <Text style={styles.name}>{data.name}</Text>
                <Text style={styles.contactLine}>
                  {data.title ? `${data.title}${contactText ? " · " : ""}` : ""}
                  {contactText}
                </Text>
                <View style={styles.rule} />
                {data.summary && (
                  <View style={{ marginBottom: 20 }}>
                    <Text style={styles.sectionLabel}>Profile</Text>
                    <Text style={styles.summaryText}>{data.summary}</Text>
                  </View>
                )}
                <View style={styles.rule} />
              </>
            )}
            {gi > 0 && (
              <View
                style={{
                  marginTop: 24,
                  borderTopWidth: 1,
                  borderTopColor: "#e5e7eb",
                  borderTopStyle: "dashed",
                  paddingTop: 24,
                }}
              />
            )}
            {group.map((key) => (
              <View key={key}>
                {renderSection(key)}
                <View style={styles.rule} />
              </View>
            ))}
          </Page>
        );
      })}
    </Document>
  );
}

function BoldPdfDocument({
  data,
  sectionOrder,
  pdfScale = 1.0,
}: {
  data: StructuredCVData;
  sectionOrder?: SectionOrderItem[];
  pdfScale?: number;
}) {
  const allKeys = orderedSections(sectionOrder, [
    "experience",
    "languages",
    "education",
    "skills",
    "references",
  ]);
  const groups = splitAtPageBreaks(sectionOrder, allKeys);

  const sc = 0.75 * pdfScale;

  const styles = StyleSheet.create({
    topBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: BOLD_INK,
      borderBottomStyle: "solid",
    },
    topBarText: {
      fontSize: 6.75 * sc,
      textTransform: "uppercase",
      letterSpacing: 1.5,
      color: BOLD_INK,
    },
    heroRow: {
      flexDirection: "row",
      paddingHorizontal: 24,
      paddingVertical: 24,
      gap: 16,
    },
    heroLeft: {
      flex: 1,
    },
    heroTitle: {
      fontSize: 37.5 * sc,
      fontWeight: 900,
      textTransform: "uppercase",
      color: BOLD_INK,
      letterSpacing: -0.75,
      marginBottom: 8,
    },
    heroSubtitle: {
      fontSize: 8.25 * sc,
      textTransform: "uppercase",
      letterSpacing: 1.5,
      color: BOLD_INK,
      marginBottom: 4,
    },
    heroSummary: {
      fontSize: 9.75 * sc,
      lineHeight: 1.6,
      color: BOLD_MUTED,
      width: 280,
    },
    heroPhoto: {
      width: 108,
      height: 144,
      borderRadius: 3,
      backgroundColor: "#C8C5BC",
    },
    fullRule: {
      height: 1,
      backgroundColor: BOLD_INK,
      marginHorizontal: 24,
    },
    bodyRow: {
      flexDirection: "row",
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 16,
      gap: 30,
    },
    bodyCol: {
      flex: 1,
    },
    sectionLabel: {
      fontSize: 8.25 * sc,
      textTransform: "uppercase",
      letterSpacing: 1.5,
      color: BOLD_INK,
      fontWeight: 700,
      marginBottom: 8,
    },
    expCompany: {
      fontSize: 8.25 * sc,
      fontWeight: 700,
      textTransform: "uppercase",
      color: BOLD_INK,
    },
    expDate: {
      fontSize: 7.5 * sc,
      color: BOLD_MUTED,
    },
    expCity: {
      fontSize: 7.5 * sc,
      fontStyle: "normal",
      color: BOLD_MUTED,
    },
    expComment: {
      fontSize: 7.5 * sc,
      color: BOLD_MUTED,
      marginTop: 2,
    },
    languageRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    languageName: {
      fontSize: 9 * sc,
      color: BOLD_INK,
    },
    skillPill: {
      fontSize: 7.5 * sc,
      fontWeight: 700,
      textTransform: "uppercase",
      paddingHorizontal: 9,
      paddingVertical: 3.375,
      borderRadius: 9999,
      marginRight: 4,
      marginBottom: 4,
    },
  });

  function renderSection(key: string) {
    if (key === "experience" && data.experience.length > 0) {
      return (
        <View key="experience" style={{ marginBottom: 30 }}>
          <Text style={styles.sectionLabel}>Experience</Text>
          {data.experience.map((item, i) => (
            <View key={i} style={{ marginBottom: 10 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={styles.expCompany}>
                  {item.title ?? item.company}
                </Text>
                {(item.start_date || item.end_date) && (
                  <Text style={styles.expDate}>
                    {item.start_date && item.end_date
                      ? `${item.start_date} – ${item.end_date}`
                      : (item.start_date ?? item.end_date)}
                  </Text>
                )}
              </View>
              {item.title && item.company && (
                <Text style={styles.expCity}>{item.company}</Text>
              )}
              {item.city && <Text style={styles.expCity}>{item.city}</Text>}
              {item.comments && (
                <Text style={styles.expComment}>{item.comments}</Text>
              )}
            </View>
          ))}
        </View>
      );
    }
    if (key === "languages" && data.languages.length > 0) {
      return (
        <View key="languages">
          <Text style={styles.sectionLabel}>Languages</Text>
          {data.languages.map((item, i) => (
            <View key={i} style={styles.languageRow}>
              <Text style={styles.languageName}>{item.language}</Text>
              <View style={{ flexDirection: "row", gap: 3 }}>
                {Array.from({ length: 5 }).map((_, di) => {
                  const map: Record<string, number> = {
                    native: 5,
                    fluent: 4,
                    advanced: 3,
                    intermediate: 2,
                    basic: 1,
                  };
                  const filled = map[(item.level ?? "").toLowerCase()] ?? 3;
                  return (
                    <View
                      key={di}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: di < filled ? BOLD_INK : "transparent",
                        borderWidth: 1,
                        borderColor: BOLD_INK,
                      }}
                    />
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      );
    }
    if (key === "education" && data.education.length > 0) {
      return (
        <View key="education" style={{ marginBottom: 30 }}>
          <Text style={styles.sectionLabel}>Education</Text>
          {data.education.map((item, i) => (
            <View key={i} style={{ marginBottom: 10 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={styles.expCompany}>{item.edu_center}</Text>
                {(item.start_date || item.end_date) && (
                  <Text style={styles.expDate}>
                    {item.start_date && item.end_date
                      ? `${item.start_date} – ${item.end_date}`
                      : (item.start_date ?? item.end_date)}
                  </Text>
                )}
              </View>
              {item.city && <Text style={styles.expCity}>{item.city}</Text>}
            </View>
          ))}
        </View>
      );
    }
    if (key === "skills" && data.skills.length > 0) {
      return (
        <View key="skills" style={{ marginBottom: 30 }}>
          <Text style={styles.sectionLabel}>Skills</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {data.skills.map((item, i) => (
              <Text
                key={i}
                style={{
                  ...styles.skillPill,
                  ...(i < Math.ceil(data.skills.length / 2)
                    ? { backgroundColor: BOLD_INK, color: BOLD_BG }
                    : {
                        backgroundColor: "transparent",
                        color: BOLD_INK,
                        borderWidth: 1,
                        borderColor: BOLD_INK,
                      }),
                }}
              >
                {item.skill}
              </Text>
            ))}
          </View>
        </View>
      );
    }
    if (key === "references" && data.references.length > 0) {
      return (
        <View key="references">
          <Text style={styles.sectionLabel}>References</Text>
          <Text
            style={{ fontSize: 8 * sc, color: BOLD_MUTED, lineHeight: 1.5 }}
          >
            {data.references}
          </Text>
        </View>
      );
    }
    return null;
  }

  return (
    <Document>
      {groups.map((group, gi) => {
        if (!groupHasContent(group, data)) return null;
        return (
          <Page
            key={gi}
            size="A4"
            style={{
              backgroundColor: BOLD_BG,
              fontFamily: "DM Sans",
            }}
          >
            {gi === 0 && (
              <>
                <View style={styles.topBar}>
                  <Text style={styles.topBarText}>{data.name}</Text>
                  <Text style={styles.topBarText}>
                    {data.contact[0]?.detail}
                  </Text>
                  <Text style={styles.topBarText}>
                    {data.contact[1]?.detail}
                  </Text>
                </View>
                <View style={styles.heroRow}>
                  <View style={styles.heroLeft}>
                    <Text style={styles.heroTitle}>{data.title}</Text>
                    <Text style={styles.heroSubtitle}>{data.title}</Text>
                    {data.summary && (
                      <Text style={styles.heroSummary}>{data.summary}</Text>
                    )}
                  </View>
                  <View style={styles.heroPhoto}>
                    {data.photo ? (
                      <Image
                        src={data.photo}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: 4,
                        }}
                      />
                    ) : (
                      <View
                        style={{
                          width: "100%",
                          height: "100%",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: BOLD_INK,
                            opacity: 0.15,
                          }}
                        />
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.fullRule} />
              </>
            )}
            {gi > 0 && (
              <View
                style={{
                  marginTop: 24,
                  borderTopWidth: 1,
                  borderTopColor: "#e5e7eb",
                  borderTopStyle: "dashed",
                  paddingTop: 24,
                }}
              />
            )}
            <View style={styles.bodyRow}>
              <View style={{ ...styles.bodyCol, flex: 2 }}>
                {group
                  .filter((k) => k === "experience")
                  .map((key) => (
                    <View key={key}>{renderSection(key)}</View>
                  ))}
              </View>
              <View style={{ ...styles.bodyCol, flex: 1 }}>
                {group
                  .filter(
                    (k) =>
                      k === "education" ||
                      k === "skills" ||
                      k === "languages" ||
                      k === "references",
                  )
                  .map((key) => (
                    <View key={key}>{renderSection(key)}</View>
                  ))}
              </View>
            </View>
          </Page>
        );
      })}
    </Document>
  );
}

function MinimalPdfDocument({
  data,
  sectionOrder,
  pdfScale = 1.0,
}: {
  data: StructuredCVData;
  sectionOrder?: SectionOrderItem[];
  pdfScale?: number;
}) {
  const sidebarKeys = orderedSections(sectionOrder, [
    "contact",
    "skills",
    "education",
    "languages",
  ]);
  const mainKeys = orderedSections(sectionOrder, ["experience", "references"]);
  const pageGroups = splitAtPageBreaks(sectionOrder, [
    ...sidebarKeys,
    ...mainKeys,
  ]);

  const sc = 0.75 * pdfScale;

  const styles = StyleSheet.create({
    page: {
      fontFamily: "DM Sans",
      backgroundColor: "#ffffff",
      flexDirection: "column",
    },
    topRow: {
      flexDirection: "row",
    },
    photoCol: {
      width: 165,
      backgroundColor: "#333333",
    },
    photo: {
      width: "100%",
      height: 240,
      objectFit: "cover",
    },
    infoCol: {
      flex: 1,
      paddingHorizontal: 32,
      paddingVertical: 28,
    },
    name: {
      fontFamily: "Playfair Display",
      fontSize: 24.75 * sc,
      fontWeight: 700,
      color: MINIMAL_INK,
      marginBottom: 3,
    },
    title: {
      fontSize: 9 * sc,
      color: MINIMAL_MUTED,
      marginBottom: 7.5,
    },
    shortRule: {
      width: 24,
      height: 0.5,
      backgroundColor: MINIMAL_INK,
      marginVertical: 9,
    },
    sidebarSectionLabel: {
      fontSize: 9 * sc,
      textTransform: "uppercase",
      letterSpacing: 1.5,
      color: "#ffffff",
      fontWeight: 700,
      marginBottom: 6,
    },
    mainSectionLabel: {
      fontSize: 9 * sc,
      textTransform: "uppercase",
      letterSpacing: 1.5,
      color: MINIMAL_INK,
      fontWeight: 700,
      marginBottom: 6,
    },
    summaryText: {
      fontSize: 10.5 * sc,
      lineHeight: 1.6,
      color: MINIMAL_MUTED,
    },
    fullRule: {
      height: 1,
      backgroundColor: "#e0e0e0",
    },
    bodyRow: {
      flexDirection: "row",
      alignItems: "stretch",
      flex: 1,
    },
    sideCol: {
      width: 165,
      backgroundColor: "#111111",
      borderRightWidth: 1,
      borderRightColor: "#e0e0e0",
      borderRightStyle: "solid",
      paddingHorizontal: 18,
      paddingVertical: 21,
      flexDirection: "column",
      gap: 24,
    },
    mainCol: {
      flex: 1,
      paddingHorizontal: 32,
      paddingVertical: 28,
      flexDirection: "column",
      gap: 24,
    },
    contactItem: {
      fontSize: 9 * sc,
      color: "rgba(255,255,255,0.65)",
      lineHeight: 1.5,
      marginBottom: 2,
    },
    skillItem: {
      fontSize: 9.75 * sc,
      color: "rgba(255,255,255,0.65)",
      lineHeight: 1.5,
      marginBottom: 2,
    },
    languageItem: {
      fontSize: 10.5 * sc,
      color: "rgba(255,255,255,0.65)",
      lineHeight: 1.5,
      marginBottom: 2,
    },
    eduTitle: {
      fontSize: 9 * sc,
      fontWeight: 700,
      textTransform: "uppercase",
      color: "#ffffff",
      marginBottom: 1,
    },
    eduSub: {
      fontSize: 7.5 * sc,
      color: "rgba(255,255,255,0.65)",
    },
    expCompany: {
      fontSize: 10.5 * sc,
      fontWeight: 700,
      textTransform: "uppercase",
      color: MINIMAL_INK,
    },
    expDate: {
      fontSize: 8 * sc,
      color: MINIMAL_MUTED,
    },
    expCity: {
      fontSize: 8 * sc,
      color: MINIMAL_MUTED,
    },
    expComment: {
      fontSize: 8.25 * sc,
      color: MINIMAL_MUTED,
      lineHeight: 1.5,
      marginTop: 2,
    },
  });

  function renderSidebarSection(key: string) {
    if (key === "skills" && data.skills.length > 0) {
      return (
        <View key="skills">
          <Text style={styles.sidebarSectionLabel}>Skills</Text>
          {data.skills.map((item, i) => (
            <Text key={i} style={styles.skillItem}>
              • {item.skill}
            </Text>
          ))}
        </View>
      );
    }
    if (key === "languages" && data.languages.length > 0) {
      return (
        <View key="languages">
          <Text style={styles.sidebarSectionLabel}>Languages</Text>
          {data.languages.map((item, i) => (
            <Text key={i} style={styles.languageItem}>
              • {item.language}
              {item.level ? ` — ${item.level}` : ""}
            </Text>
          ))}
        </View>
      );
    }
    if (key === "contact" && data.contact.length > 0) {
      return (
        <View key="contact">
          <Text style={styles.sidebarSectionLabel}>Contact</Text>
          {data.contact.map((item, i) => (
            <Text key={i} style={styles.contactItem}>
              • {item.detail}
            </Text>
          ))}
        </View>
      );
    }
    if (key === "education" && data.education.length > 0) {
      return (
        <View key="education">
          <Text style={styles.sidebarSectionLabel}>Education</Text>
          {data.education.map((item, i) => (
            <View key={i} style={{ marginBottom: 6 }}>
              <Text style={styles.eduTitle}>{item.edu_center}</Text>
              <Text style={styles.eduSub}>
                {[item.start_date ?? item.end_date].filter(Boolean).join(" – ")}
              </Text>
              {item.comments && (
                <Text style={styles.eduSub}>{item.comments}</Text>
              )}
            </View>
          ))}
        </View>
      );
    }
    return null;
  }

  function renderMainSection(key: string) {
    if (key === "experience" && data.experience.length > 0) {
      return (
        <View key="experience">
          <Text style={styles.mainSectionLabel}>Experience</Text>
          {data.experience.map((item, i) => (
            <View key={i} style={{ marginBottom: 10 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={styles.expCompany}>
                  {item.title ?? item.company}
                </Text>
                {(item.start_date || item.end_date) && (
                  <Text style={styles.expDate}>
                    {item.start_date && item.end_date
                      ? `${item.start_date} – ${item.end_date}`
                      : (item.start_date ?? item.end_date)}
                  </Text>
                )}
              </View>
              {item.title && item.company && (
                <Text style={styles.expCity}>{item.company}</Text>
              )}
              {item.city && <Text style={styles.expCity}>{item.city}</Text>}
              {item.comments && (
                <Text style={styles.expComment}>{item.comments}</Text>
              )}
            </View>
          ))}
        </View>
      );
    }
    if (key === "references" && data.references) {
      return (
        <View key="references">
          <Text style={styles.mainSectionLabel}>References</Text>
          <Text
            style={{ fontSize: 8 * sc, color: MINIMAL_MUTED, lineHeight: 1.5 }}
          >
            {data.references}
          </Text>
        </View>
      );
    }
    return null;
  }

  return (
    <Document>
      {pageGroups.map((pageKeys, gi) => {
        if (!groupHasContent(pageKeys, data)) return null;
        const pageSidebarKeys = pageKeys.filter((k) => sidebarKeys.includes(k));
        const pageMainKeys = pageKeys.filter((k) => mainKeys.includes(k));
        return (
          <Page key={gi} size="A4" style={styles.page}>
            {gi === 0 && (
              <>
                <View style={styles.topRow}>
                  <View style={styles.photoCol}>
                    {data.photo ? (
                      <Image src={data.photo} style={styles.photo} />
                    ) : (
                      <View
                        style={{
                          width: "100%",
                          height: 180,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: MINIMAL_INK,
                            opacity: 0.15,
                          }}
                        />
                      </View>
                    )}
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.name}>{data.name}</Text>
                    {data.title && (
                      <Text style={styles.title}>{data.title}</Text>
                    )}
                    <View style={styles.shortRule} />
                    {data.summary && (
                      <Text style={styles.summaryText}>{data.summary}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.fullRule} />
              </>
            )}
            <View style={styles.bodyRow}>
              <View style={styles.sideCol}>
                {pageSidebarKeys.map((key) => renderSidebarSection(key))}
              </View>
              <View style={styles.mainCol}>
                {pageMainKeys.map((key) => renderMainSection(key))}
              </View>
            </View>
          </Page>
        );
      })}
    </Document>
  );
}

export function CvPdfDocument({
  data,
  template,
  sectionOrder,
  pdfScale = 1.0,
}: {
  data: StructuredCVData;
  template: CVTemplateId;
  sectionOrder?: SectionOrderItem[];
  pdfScale?: number;
}) {
  if (template === "sage")
    return (
      <SagePdfDocument
        data={data}
        sectionOrder={sectionOrder}
        pdfScale={pdfScale}
      />
    );
  if (template === "classic")
    return (
      <ClassicPdfDocument
        data={data}
        sectionOrder={sectionOrder}
        pdfScale={pdfScale}
      />
    );
  if (template === "bold")
    return (
      <BoldPdfDocument
        data={data}
        sectionOrder={sectionOrder}
        pdfScale={pdfScale}
      />
    );
  if (template === "minimal")
    return (
      <MinimalPdfDocument
        data={data}
        sectionOrder={sectionOrder}
        pdfScale={pdfScale}
      />
    );
  return (
    <TerracottaPdfDocument
      data={data}
      sectionOrder={sectionOrder}
      pdfScale={pdfScale}
    />
  );
}
