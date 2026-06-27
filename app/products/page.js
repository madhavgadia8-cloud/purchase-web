import { db } from "@/lib/db";
import AdminShell from "@/app/AdminShell";
import ProductForm from "@/app/ProductForm";
import { deleteProduct } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function ProductsPage({ searchParams }) {
  let products = [];
  let dbError = null;
  try {
    const supabase = db();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    products = data || [];
  } catch (e) {
    dbError = e.message;
  }

  return (
    <AdminShell>
      <h1 className="page-title">Products</h1>
      <p className="page-sub">Your product catalogue — add items once and reuse them in requirements.</p>

      <div className="card">
        <h2>Add a product</h2>
        <ProductForm error={searchParams?.e === "name"} />
      </div>

      <div className="card">
        <h2>All products ({products.length})</h2>
        {dbError ? (
          <p className="muted">
            Could not load products: {dbError}. Did you run the latest schema SQL in Supabase?
          </p>
        ) : products.length === 0 ? (
          <div className="empty">No products yet. Add your first one above.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th><th>Code</th><th>Unit</th><th>Category</th><th>Notes</th><th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.name}</strong></td>
                    <td>{p.code || "—"}</td>
                    <td>{p.unit || "—"}</td>
                    <td>{p.category || "—"}</td>
                    <td>{p.notes || "—"}</td>
                    <td>
                      <form action={deleteProduct}>
                        <input type="hidden" name="id" value={p.id} />
                        <button className="btn danger sm" type="submit">Delete</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
