-- نظام إدارة الطلبات - قاعدة البيانات
-- متجر البخور والعطور

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE order_status AS ENUM (
    'pending',
    'confirmed', 
    'processing',
    'shipped',
    'delivered',
    'cancelled'
);

CREATE TYPE discount_type AS ENUM (
    'percentage',
    'fixed'
);

-- Categories table
CREATE TABLE categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers table
CREATE TABLE customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    cost DECIMAL(10,2) CHECK (cost >= 0),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    category_id UUID REFERENCES categories(id),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Discounts table
CREATE TABLE discounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code VARCHAR(50) UNIQUE,
    type discount_type NOT NULL,
    value DECIMAL(10,2) NOT NULL CHECK (value >= 0),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    status order_status DEFAULT 'pending',
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    discount_amount DECIMAL(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    notes TEXT,
    discount_id UUID REFERENCES discounts(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices table
CREATE TABLE invoices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shipping stickers table
CREATE TABLE shipping_stickers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    sticker_number VARCHAR(50) NOT NULL UNIQUE,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_categories_name ON categories(name);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_is_active ON categories(is_active);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_discounts_code ON discounts(code);
CREATE INDEX idx_discounts_is_active ON discounts(is_active);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discounts_updated_at BEFORE UPDATE ON discounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_stickers ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth requirements)
-- For now, allowing all operations for authenticated users
CREATE POLICY "Enable all operations for authenticated users" ON categories
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON customers
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON products
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON orders
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON order_items
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON discounts
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON invoices
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON shipping_stickers
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert sample data
INSERT INTO categories (name, description, is_active) VALUES
('البخور', 'جميع أنواع البخور والعود', true),
('العطور', 'العطور الطبيعية والمصنعة', true),
('أخرى', 'منتجات أخرى متنوعة', true);

INSERT INTO categories (name, description, parent_id, is_active) VALUES
('عود طبيعي', 'عود طبيعي أصلي من الهند', (SELECT id FROM categories WHERE name = 'البخور'), true),
('عود محسن', 'عود محسن بجودة عالية', (SELECT id FROM categories WHERE name = 'البخور'), true),
('صندل أحمر', 'صندل أحمر من سريلانكا', (SELECT id FROM categories WHERE name = 'البخور'), true),
('ورد دمشقي', 'عطر ورد دمشقي طبيعي', (SELECT id FROM categories WHERE name = 'العطور'), true),
('مسك أبيض', 'عطر مسك أبيض طبيعي', (SELECT id FROM categories WHERE name = 'العطور'), true);

INSERT INTO customers (name, phone, email, address, city) VALUES
('أحمد محمد', '0501234567', 'ahmed@example.com', 'شارع الملك فهد، الرياض', 'الرياض'),
('فاطمة علي', '0507654321', 'fatima@example.com', 'شارع العليا، جدة', 'جدة'),
('محمد السعد', '0509876543', 'mohammed@example.com', 'شارع التحلية، الدمام', 'الدمام');

INSERT INTO products (name, description, price, cost, stock_quantity, category_id) VALUES
('بخور العود الأصلي', 'بخور عود أصلي من الهند، رائحة مميزة وقوية', 150.00, 100.00, 50, (SELECT id FROM categories WHERE name = 'عود طبيعي')),
('عطر الورد الدمشقي', 'عطر ورد دمشقي طبيعي، رائحة عطرة وناعمة', 200.00, 120.00, 30, (SELECT id FROM categories WHERE name = 'ورد دمشقي')),
('بخور الصندل الأحمر', 'بخور صندل أحمر من سريلانكا، رائحة دافئة', 180.00, 110.00, 40, (SELECT id FROM categories WHERE name = 'صندل أحمر')),
('عطر المسك الأبيض', 'عطر مسك أبيض طبيعي، رائحة قوية ومميزة', 250.00, 150.00, 25, (SELECT id FROM categories WHERE name = 'مسك أبيض')),
('بخور اللبان الحوجري', 'بخور لبان حوجري أصلي، رائحة تقليدية', 120.00, 80.00, 60, (SELECT id FROM categories WHERE name = 'عود محسن'));

INSERT INTO discounts (code, type, value, description, is_active) VALUES
('WELCOME10', 'percentage', 10, 'خصم ترحيبي 10% للعملاء الجدد', true),
('SAVE50', 'fixed', 50, 'خصم ثابت 50 ريال', true),
('VIP20', 'percentage', 20, 'خصم VIP 20%', true);

-- Create views for common queries
CREATE VIEW order_summary AS
SELECT 
    o.id,
    o.order_number,
    o.status,
    o.total_amount,
    o.created_at,
    c.name as customer_name,
    c.phone as customer_phone,
    COUNT(oi.id) as items_count
FROM orders o
JOIN customers c ON o.customer_id = c.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.order_number, o.status, o.total_amount, o.created_at, c.name, c.phone;

CREATE VIEW product_sales AS
SELECT 
    p.id,
    p.name,
    p.price,
    SUM(oi.quantity) as total_sold,
    SUM(oi.total_price) as total_revenue
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id
WHERE o.status IN ('delivered', 'shipped')
GROUP BY p.id, p.name, p.price;

-- Create functions for common operations
CREATE OR REPLACE FUNCTION get_order_total(order_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    total DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(total_price), 0) INTO total
    FROM order_items
    WHERE order_id = get_order_total.order_id;
    
    RETURN total;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_order_totals(order_id UUID)
RETURNS VOID AS $$
DECLARE
    subtotal DECIMAL(10,2);
    discount_amount DECIMAL(10,2);
    total_amount DECIMAL(10,2);
BEGIN
    -- Calculate subtotal
    SELECT COALESCE(SUM(total_price), 0) INTO subtotal
    FROM order_items
    WHERE order_id = update_order_totals.order_id;
    
    -- Get discount amount
    SELECT COALESCE(o.discount_amount, 0) INTO discount_amount
    FROM orders o
    WHERE o.id = update_order_totals.order_id;
    
    -- Calculate total
    total_amount := subtotal - discount_amount;
    
    -- Update order
    UPDATE orders
    SET subtotal = subtotal,
        total_amount = total_amount,
        updated_at = NOW()
    WHERE id = update_order_totals.order_id;
END;
$$ LANGUAGE plpgsql;

