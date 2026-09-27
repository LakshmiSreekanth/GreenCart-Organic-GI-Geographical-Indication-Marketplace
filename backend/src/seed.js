const bcrypt = require("bcryptjs");
const { get, run } = require("./db");

const hash = (pwd) => bcrypt.hashSync(pwd, 10);

function seedIfEmpty() {
  const existing = get("SELECT COUNT(*) AS c FROM users");
  if (existing && existing.c > 0) return false;

  run(
    "INSERT INTO users (name, email, password_hash, role, phone, address) VALUES (?, ?, ?, ?, ?, ?)",
    ["GreenCart Admin", "admin@greencart.in", hash("Admin@123"), "admin", "9990001111", "Noida, Uttar Pradesh"]
  );

  const farmerUsers = [
    ["Meera Iyer", "farmer@greencart.in", "Farmer@123", "9442211000", "Coonoor, Tamil Nadu", "Nilgiri Hills Organics", "Tamil Nadu", "approved"],
    ["Ravi Patel", "ravi@greencart.in", "Farmer@123", "9825012345", "Junagadh, Gujarat", "Gir Organic Orchards", "Gujarat", "approved"],
    ["Anita Devi", "anita@greencart.in", "Farmer@123", "9800011122", "Darjeeling, West Bengal", "Teesta Valley Estate", "West Bengal", "approved"],
    ["Pending Singh", "pending@greencart.in", "Farmer@123", "9876500001", "Nashik, Maharashtra", "Godavari Fresh Farm", "Maharashtra", "pending"],
  ];

  const farmerIds = {};
  for (const [name, email, pwd, phone, address, farm, loc, status] of farmerUsers) {
    const u = run(
      "INSERT INTO users (name, email, password_hash, role, phone, address) VALUES (?, ?, ?, ?, ?, ?)",
      [name, email, hash(pwd), "farmer", phone, address]
    );
    const f = run(
      "INSERT INTO farmers (user_id, farm_name, location, certificate_path, certificate_status) VALUES (?, ?, ?, ?, ?)",
      [u.lastInsertRowid, farm, loc, "/uploads/certificates/sample-organic.pdf", status]
    );
    farmerIds[email] = f.lastInsertRowid;
  }

  run(
    "INSERT INTO users (name, email, password_hash, role, phone, address) VALUES (?, ?, ?, ?, ?, ?)",
    ["Priya Sharma", "customer@greencart.in", hash("Customer@123"), "customer", "9810012345", "12, Sector 62, Noida"]
  );
  const customer = get("SELECT id FROM users WHERE email = ?", ["customer@greencart.in"]);

  const nilgiri = farmerIds["farmer@greencart.in"];
  const gir = farmerIds["ravi@greencart.in"];
  const darjeeling = farmerIds["anita@greencart.in"];

  const products = [
    [nilgiri, "Nilgiri Orthodox Tea", "Hand-plucked second flush from Coonoor estates. GI-tagged Nilgiri tea with bright liquor.", "Tea & Coffee", "Nilgiri Tea", 1, 1, 420, 80, "250g", "Coonoor, Tamil Nadu", "https://images.unsplash.com/photo-1556679343-c7306c197480?w=800&q=80"],
    [nilgiri, "Organic Peppercorns", "Sun-dried Malabar pepper grown without chemical spray.", "Spices", null, 0, 1, 280, 120, "200g", "Wayanad, Kerala", "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80"],
    [gir, "Gir Kesar Mango", "GI-tagged Gir Kesar — saffron-coloured pulp, harvested at peak ripeness.", "Fruits", "Gir Kesar Mango", 1, 1, 650, 40, "box (3kg)", "Junagadh, Gujarat", "https://images.unsplash.com/photo-1553279768-865429fa0078?w=800&q=80"],
    [gir, "Organic Groundnut Oil", "Cold-pressed from Saurashtra groundnuts. Unrefined, nutty aroma.", "Oils", null, 0, 1, 310, 60, "1L", "Rajkot, Gujarat", "https://images.unsplash.com/photo-1474979266404-7ea319b26700?w=800&q=80"],
    [darjeeling, "Darjeeling First Flush", "GI-certified Darjeeling tea. Muscatel notes, limited spring harvest.", "Tea & Coffee", "Darjeeling Tea", 1, 1, 890, 35, "100g", "Darjeeling, West Bengal", "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=800&q=80"],
    [darjeeling, "Organic Wild Honey", "Forest honey from the Himalayan foothills. Unheated, unfiltered.", "Pantry", null, 0, 1, 540, 50, "500g", "Kalimpong, West Bengal", "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&q=80"],
    [nilgiri, "Alphonso Mango Pulp", "GI Alphonso pulp, no added sugar. For shrikhand and ice cream.", "Fruits", "Alphonso Mango", 1, 1, 380, 70, "850g tin", "Ratnagiri, Maharashtra", "https://images.unsplash.com/photo-1605027990121-cbae9e0642df?w=800&q=80"],
    [gir, "Basmati Rice (Dehradun)", "GI-tagged Dehradun basmati. Aged 12 months, extra-long grain.", "Grains", "Basmati Rice", 1, 1, 220, 200, "1kg", "Dehradun, Uttarakhand", "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&q=80"],
    [darjeeling, "Nagpur Orange Marmalade", "Small-batch marmalade from GI Nagpur oranges.", "Pantry", "Nagpur Orange", 1, 1, 260, 45, "300g", "Nagpur, Maharashtra", "https://images.unsplash.com/photo-1523049673857-eb18f1d7b859?w=800&q=80"],
    [nilgiri, "Organic Turmeric Finger", "High-curcumin Erode turmeric. GI-associated spice belt.", "Spices", "Erode Turmeric", 1, 1, 190, 90, "250g", "Erode, Tamil Nadu", "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&q=80"],
  ];

  const productIds = [];
  for (const p of products) {
    const r = run(
      `INSERT INTO products (farmer_id, name, description, category, gi_tag, is_gi, is_organic, price, stock, unit, location, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      p
    );
    productIds.push(r.lastInsertRowid);
  }

  const order = run(
    "INSERT INTO orders (customer_id, total, status, shipping_address) VALUES (?, ?, 'delivered', ?)",
    [customer.id, 1310, "12, Sector 62, Noida"]
  );
  run("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)", [
    order.lastInsertRowid,
    productIds[4],
    1,
    890,
  ]);
  run("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)", [
    order.lastInsertRowid,
    productIds[0],
    1,
    420,
  ]);

  run("INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)", [
    productIds[4],
    customer.id,
    5,
    "True muscatel aroma. Feels like a cup from the estate itself.",
  ]);
  run("INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)", [
    productIds[0],
    customer.id,
    4,
    "Bright and clean. Perfect everyday GI tea.",
  ]);

  return true;
}

if (require.main === module) {
  const { initDb } = require("./db");
  initDb()
    .then(() => {
      const seeded = seedIfEmpty();
      console.log(seeded ? "Marketplace data seeded successfully!" : "Database already has data.");
    })
    .catch((err) => {
      console.error("Seed error:", err);
    });
}

module.exports = { seedIfEmpty };
