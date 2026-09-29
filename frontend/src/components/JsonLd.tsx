import { Helmet } from 'react-helmet-async'
import { jsonLdString } from '../lib/structuredData'

/** Emits one JSON-LD structured data block in <head>. */
export default function JsonLd({ data }: { data: object }) {
  return (
    <Helmet>
      <script type="application/ld+json">{jsonLdString(data)}</script>
    </Helmet>
  )
}
