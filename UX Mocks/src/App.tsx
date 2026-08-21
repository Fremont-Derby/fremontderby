import { Link } from 'react-router'

interface PageConfig {
  pageId: string
  name: string
  frames: { id: string; name: string }[]
}

const pageConfigs = import.meta.glob<PageConfig>('./pages/*/page.json', {
  eager: true,
  import: 'default',
})

const pages = Object.values(pageConfigs) as PageConfig[]

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column' as const,
    minHeight: '100vh',
    backgroundColor: 'oklch(0.98 0 0)',
    color: 'oklch(0.16 0 0)',
  },
  header: {
    padding: '24px 32px 20px',
    borderBottom: '1px solid oklch(0.16 0 0 / 16%)',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 700,
    lineHeight: '20px',
    letterSpacing: '0.02em',
    textTransform: 'uppercase' as const,
    color: 'oklch(0.48 0 0)',
  },
  content: {
    flex: 1,
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  pageGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  pageName: {
    fontSize: 13,
    fontWeight: 700,
    lineHeight: '28px',
    padding: '0 16px',
  },
  frameLink: {
    display: 'block',
    fontSize: 13,
    fontWeight: 400,
    lineHeight: '28px',
    color: 'oklch(0.28 0 0)',
    textDecoration: 'none',
    padding: '0 16px 0 32px',
    borderRadius: 6,
    transition: 'background-color 0.15s, color 0.15s',
  },
  frameLinkHover: {
    backgroundColor: 'oklch(0.16 0 0 / 8%)',
    color: 'oklch(0.16 0 0)',
  },
}

export default function App() {
  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <span style={styles.headerTitle}>Pages</span>
      </div>
      <nav style={styles.content}>
        {pages.map(page => (
          <div key={page.pageId} style={styles.pageGroup}>
            <span style={styles.pageName}>{page.name}</span>
            {page.frames.map(f => (
              <Link
                key={f.id}
                to={`/pages/${page.pageId}/${f.id}`}
                style={styles.frameLink}
                onMouseEnter={e =>
                  Object.assign(e.currentTarget.style, styles.frameLinkHover)
                }
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = ''
                  e.currentTarget.style.color = styles.frameLink.color
                }}
              >
                {f.name}
              </Link>
            ))}
          </div>
        ))}
      </nav>
    </div>
  )
}
