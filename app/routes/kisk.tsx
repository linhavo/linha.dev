import { PostLayout } from "../components/PostLayout";

export function meta() {
  return [{ title: "KISK — linha.dev" }];
}

export default function Kisk() {
  return (
    <PostLayout
      heading="KISK Portfolio"
      subheading="Aneb jak jsem studoval v Brně"
    >
      <p>Hello world!</p>
    </PostLayout>
  );
}
