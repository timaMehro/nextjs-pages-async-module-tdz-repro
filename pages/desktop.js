// The whole mobile page module is pulled into this bundle by the re-export.
export { getServerSideProps } from './mobile'

export default function Desktop({ label }) {
  return <p>desktop: {label}</p>
}
