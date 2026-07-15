import ResourceList from "../components/ResourceList";

export default function ResourcesPage() {
  return (
    <main>
      <div className="page-head">
        <h1 className="page-title">Resources</h1>
        <p className="page-sub">Monty · Fronczak · HWI · mikinty · HDLBits · and whatever else helps</p>
      </div>
      <ResourceList />
    </main>
  );
}
