import ShoppingTable from "../components/ShoppingTable";

export default function ShoppingPage() {
  return (
    <main>
      <div className="page-head">
        <h1 className="page-title">Shopping list</h1>
        <p className="page-sub">Everything to order before the challenge starts</p>
      </div>
      <ShoppingTable />
    </main>
  );
}
