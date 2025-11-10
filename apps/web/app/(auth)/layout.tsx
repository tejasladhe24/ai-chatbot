export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex flex-col h-svh overflow-hidden">{children}</div>;
}
