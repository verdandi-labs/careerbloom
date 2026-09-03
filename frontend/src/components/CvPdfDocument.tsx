import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer"
import type { StructuredCVData } from "@/lib/cv-templates"

const TERRACOTTA = "#CB6843"
const TERRACOTTA_LIGHT = "#FDE8E8"
const MUTED = "#9b8b86"
const INK = "#1c1410"

const styles = StyleSheet.create({
  page: {
    fontFamily: "DM Sans",
    backgroundColor: "#ffffff",
    flexDirection: "row",
  },
  sidebar: {
    width: 180,
    padding: 20,
    borderRightWidth: 1,
    borderRightColor: TERRACOTTA,
    borderRightStyle: "solid",
    flexDirection: "column",
    gap: 16,
  },
  main: {
    flex: 1,
    padding: 28,
    flexDirection: "column",
    gap: 16,
  },
  sidebarLabel: {
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: TERRACOTTA,
    marginBottom: 6,
    fontWeight: 700,
  },
  contactItem: {
    fontSize: 9,
    color: MUTED,
    lineHeight: 1.5,
    marginBottom: 2,
  },
  skillPill: {
    fontSize: 8,
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
    fontSize: 9,
    color: INK,
  },
  languageLevel: {
    fontSize: 9,
    color: MUTED,
  },
  eduCenter: {
    fontSize: 9,
    fontWeight: 500,
    color: INK,
    marginBottom: 1,
  },
  eduSub: {
    fontSize: 8,
    color: MUTED,
    marginBottom: 1,
  },
  name: {
    fontFamily: "Playfair Display",
    fontSize: 28,
    fontWeight: 700,
    color: INK,
    marginBottom: 4,
  },
  jobTitle: {
    fontSize: 11,
    color: TERRACOTTA,
    marginBottom: 6,
  },
  summary: {
    fontSize: 9,
    color: MUTED,
    lineHeight: 1.6,
    maxWidth: 320,
  },
  divider: {
    height: 1,
    backgroundColor: TERRACOTTA,
    marginVertical: 4,
  },
  experienceSection: {
    flexDirection: "column",
    gap: 12,
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
    fontSize: 10,
    fontWeight: 700,
    color: INK,
  },
  expCity: {
    fontSize: 8,
    color: TERRACOTTA,
    marginTop: 1,
  },
  dateBadge: {
    fontSize: 8,
    color: MUTED,
    backgroundColor: TERRACOTTA_LIGHT,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  expComments: {
    fontSize: 9,
    color: MUTED,
    lineHeight: 1.5,
  },
  sectionBlock: {
    marginBottom: 4,
  },
})

export function CvPdfDocument({ data }: { data: StructuredCVData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Left sidebar */}
        <View style={styles.sidebar}>
          {data.contact.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sidebarLabel}>Contact</Text>
              {data.contact.map((item, i) => (
                <Text key={i} style={styles.contactItem}>{item.detail}</Text>
              ))}
            </View>
          )}

          {data.skills.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sidebarLabel}>Skills</Text>
              <View style={styles.skillsWrap}>
                {data.skills.map((item, i) => (
                  <Text key={i} style={styles.skillPill}>{item.skill}</Text>
                ))}
              </View>
            </View>
          )}

          {data.languages.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sidebarLabel}>Languages</Text>
              {data.languages.map((item, i) => (
                <View key={i} style={styles.languageRow}>
                  <Text style={styles.languageName}>{item.language}</Text>
                  {item.level && <Text style={styles.languageLevel}>{item.level}</Text>}
                </View>
              ))}
            </View>
          )}

          {data.education.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sidebarLabel}>Education</Text>
              {data.education.map((item, i) => (
                <View key={i} style={{ marginBottom: 6 }}>
                  <Text style={styles.eduCenter}>{item.edu_center}</Text>
                  <Text style={styles.eduSub}>
                    {[item.city, item.end_date ?? item.start_date].filter(Boolean).join(" · ")}
                  </Text>
                  {item.comments && <Text style={styles.eduSub}>{item.comments}</Text>}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Right main */}
        <View style={styles.main}>
          {data.name && (
            <View>
              <Text style={styles.name}>{data.name}</Text>
              {data.title && <Text style={styles.jobTitle}>{data.title}</Text>}
              {data.summary && <Text style={styles.summary}>{data.summary}</Text>}
            </View>
          )}

          <View style={styles.divider} />

          {data.experience.length > 0 && (
            <View>
              <Text style={styles.sidebarLabel}>Experience</Text>
              <View style={styles.experienceSection}>
                {data.experience.map((item, i) => (
                  <View key={i} style={styles.experienceItem}>
                    <View style={styles.expHeader}>
                      <View>
                        <Text style={styles.expCompany}>{item.company}</Text>
                        {item.city && <Text style={styles.expCity}>{item.city}</Text>}
                      </View>
                      {(item.start_date || item.end_date) && (
                        <Text style={styles.dateBadge}>
                          {item.start_date && item.end_date
                            ? `${item.start_date} – ${item.end_date}`
                            : item.start_date ?? item.end_date}
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
          )}
        </View>
      </Page>
    </Document>
  )
}
