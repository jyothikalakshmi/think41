// src/components/CustomerList.jsx
import { useEffect, useState } from "react";
import axios from "axios";

function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/customers?limit=100")
      .then((res) => {
        setCustomers(res.data.customers);
        setFiltered(res.data.customers);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to fetch customers");
        setLoading(false);
      });
  }, []);

  const handleSearch = (e) => {
    const val = e.target.value.toLowerCase();
    setSearch(val);
    const filteredList = customers.filter(
      (c) =>
        c.first_name.toLowerCase().includes(val) ||
        c.last_name.toLowerCase().includes(val) ||
        c.email.toLowerCase().includes(val)
    );
    setFiltered(filteredList);
  };

  if (loading) return <p>Loading customers...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Customer List</h2>
      <input
        type="text"
        value={search}
        onChange={handleSearch}
        placeholder="Search by name or email"
        style={{ padding: "8px", width: "250px", marginBottom: "20px" }}
      />
      <table border="1" cellPadding="10" style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Order Count</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((c) => (
            <tr key={c.id}>
              <td>{c.first_name} {c.last_name}</td>
              <td>{c.email}</td>
              <td>
                {/* Optional: Lazy fetch order count or pre-fetch from backend */}
                <OrderCount userId={c.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrderCount({ userId }) {
  const [count, setCount] = useState("...");
  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/customers/${userId}`)
      .then((res) => setCount(res.data.order_count))
      .catch(() => setCount("Error"));
  }, [userId]);

  return <>{count}</>;
}

export default CustomerList;
