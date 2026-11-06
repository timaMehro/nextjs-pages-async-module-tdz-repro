import { label } from '../lib/async-dep.mjs'

export async function getServerSideProps() {
  return { props: { label } }
}

// A const binding, not a function declaration, so the export getter reads a
// `let` that the top-level await has not reached yet.
const Mobile = ({ label }) => <p>mobile: {label}</p>

export default Mobile
