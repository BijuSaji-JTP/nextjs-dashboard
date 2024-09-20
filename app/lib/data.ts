// import { Pool } from '@neondatabase/serverless';
// import { formatCurrency } from './utils';
// import {
//   CustomerField,
//   CustomersTableType,
//   InvoiceForm,
//   InvoicesTable,
//   LatestInvoiceRaw,
//   Revenue,
// } from './definitions';

// const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
// const client = await pool.connect();

// export async function fetchRevenue() {
//   try {
//     console.log('fetchRevenue');
//     const data = await client.query<Revenue>(`SELECT * FROM revenue`);
//     console.log('data', data);
//     return data.rows;
//   } catch (error) {
//     console.error('Database Error:', error);
//     throw new Error('Failed to fetch revenue data.');
//   } finally {
//     client.release();
//   }
// }

// export async function fetchLatestInvoices() {
//   try {
//     const data = await client.query<LatestInvoiceRaw>(`
//       SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
//       FROM invoices
//       JOIN customers ON invoices.customer_id = customers.id
//       ORDER BY invoices.date DESC
//       LIMIT 5`);

//     const latestInvoices = data.rows.map((invoice) => ({
//       ...invoice,
//       amount: formatCurrency(invoice.amount),
//     }));
//     return latestInvoices;
//   } catch (error) {
//     console.error('Database Error:', error);
//     throw new Error('Failed to fetch the latest invoices.');
//   } finally {
//     client.release();
//   }
// }

// export async function fetchCardData() {
//   try {
//     const invoiceCountPromise = client.query(`SELECT COUNT(*) FROM invoices`);
//     const customerCountPromise = client.query(`SELECT COUNT(*) FROM customers`);
//     const invoiceStatusPromise = client.query(`
//       SELECT
//         SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
//         SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
//       FROM invoices`);

//     const data = await Promise.all([
//       invoiceCountPromise,
//       customerCountPromise,
//       invoiceStatusPromise,
//     ]);

//     const numberOfInvoices = Number(data[0].rows[0].count ?? '0');
//     const numberOfCustomers = Number(data[1].rows[0].count ?? '0');
//     const totalPaidInvoices = formatCurrency(data[2].rows[0].paid ?? '0');
//     const totalPendingInvoices = formatCurrency(data[2].rows[0].pending ?? '0');

//     return {
//       numberOfCustomers,
//       numberOfInvoices,
//       totalPaidInvoices,
//       totalPendingInvoices,
//     };
//   } catch (error) {
//     console.error('Database Error:', error);
//     throw new Error('Failed to fetch card data.');
//   } finally {
//     client.release();
//   }
// }

// const ITEMS_PER_PAGE = 6;
// export async function fetchFilteredInvoices(query: string, currentPage: number) {
//   const offset = (currentPage - 1) * ITEMS_PER_PAGE;

//   try {
//     const invoices = await client.query<InvoicesTable>(`
//       SELECT
//         invoices.id,
//         invoices.amount,
//         invoices.date,
//         invoices.status,
//         customers.name,
//         customers.email,
//         customers.image_url
//       FROM invoices
//       JOIN customers ON invoices.customer_id = customers.id
//       WHERE
//         customers.name ILIKE $1 OR
//         customers.email ILIKE $1 OR
//         invoices.amount::text ILIKE $1 OR
//         invoices.date::text ILIKE $1 OR
//         invoices.status ILIKE $1
//       ORDER BY invoices.date DESC
//       LIMIT $2 OFFSET $3
//     `, [`%${query}%`, ITEMS_PER_PAGE, offset]);

//     return invoices.rows;
//   } catch (error) {
//     console.error('Database Error:', error);
//     throw new Error('Failed to fetch invoices.');
//   } finally {
//     client.release();
//   }
// }

// export async function fetchInvoicesPages(query: string) {
//   try {
//     const count = await client.query(`
//       SELECT COUNT(*)
//       FROM invoices
//       JOIN customers ON invoices.customer_id = customers.id
//       WHERE
//         customers.name ILIKE $1 OR
//         customers.email ILIKE $1 OR
//         invoices.amount::text ILIKE $1 OR
//         invoices.date::text ILIKE $1 OR
//         invoices.status ILIKE $1
//     `, [`%${query}%`]);

//     const totalPages = Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
//     return totalPages;
//   } catch (error) {
//     console.error('Database Error:', error);
//     throw new Error('Failed to fetch total number of invoices.');
//   } finally {
//     client.release();
//   }
// }

// export async function fetchInvoiceById(id: string) {
//   try {
//     const data = await client.query<InvoiceForm>(`
//       SELECT
//         invoices.id,
//         invoices.customer_id,
//         invoices.amount,
//         invoices.status
//       FROM invoices
//       WHERE invoices.id = $1
//     `, [id]);

//     const invoice = data.rows.map((invoice) => ({
//       ...invoice,
//       amount: invoice.amount / 100,
//     }));

//     return invoice[0];
//   } catch (error) {
//     console.error('Database Error:', error);
//     throw new Error('Failed to fetch invoice.');
//   } finally {
//     client.release();
//   }
// }

// export async function fetchCustomers() {
//   try {
//     const data = await client.query<CustomerField>(`
//       SELECT
//         id,
//         name
//       FROM customers
//       ORDER BY name ASC
//     `);

//     return data.rows;
//   } catch (err) {
//     console.error('Database Error:', err);
//     throw new Error('Failed to fetch all customers.');
//   } finally {
//     client.release();
//   }
// }

// export async function fetchFilteredCustomers(query: string) {
//   try {
//     const data = await client.query<CustomersTableType>(`
//       SELECT
//         customers.id,
//         customers.name,
//         customers.email,
//         customers.image_url,
//         COUNT(invoices.id) AS total_invoices,
//         SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
//         SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
//       FROM customers
//       LEFT JOIN invoices ON customers.id = invoices.customer_id
//       WHERE
//         customers.name ILIKE $1 OR
//         customers.email ILIKE $1
//       GROUP BY customers.id, customers.name, customers.email, customers.image_url
//       ORDER BY customers.name ASC
//     `, [`%${query}%`]);

//     const customers = data.rows.map((customer) => ({
//       ...customer,
//       total_pending: formatCurrency(customer.total_pending),
//       total_paid: formatCurrency(customer.total_paid),
//     }));

//     return customers;
//   } catch (err) {
//     console.error('Database Error:', err);
//     throw new Error('Failed to fetch customer table.');
//   } finally {
//     client.release();
//   }
// }

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  Revenue,
} from './definitions';
import { formatCurrency } from './utils';
 
// Configure neon to use ws for WebSocket
neonConfig.webSocketConstructor = ws;
 
// If in development, use the WebSocket proxy
if (process.env.VERCEL_ENV === "development") {
  neonConfig.wsProxy = (host) => `${host}:54330/v1`;
  neonConfig.useSecureWebSocket = false;
  neonConfig.pipelineTLS = false;
  neonConfig.pipelineConnect = false;
}
 
// Create a new pool using the connection string from your .env file
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
 
export async function fetchRevenue() {
  try {
    const client = await pool.connect();
    console.log('Fetching revenue data...');
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const result = await client.query<Revenue>('SELECT * FROM revenue');
    console.log('Data fetch completed after 3 seconds.');
    client.release();
    return result.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}
 
export async function fetchLatestInvoices() {
  try {
    const client = await pool.connect();
    const result = await client.query<LatestInvoiceRaw>(`
      SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      ORDER BY invoices.date DESC
      LIMIT 5
    `);
    client.release();
 
    const latestInvoices = result.rows.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}
 
export async function fetchCardData() {
  try {
    const client = await pool.connect();
    const [invoiceCountResult, customerCountResult, invoiceStatusResult] = await Promise.all([
      client.query('SELECT COUNT(*) FROM invoices'),
      client.query('SELECT COUNT(*) FROM customers'),
      client.query(`
        SELECT
          SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
        FROM invoices
      `),
    ]);
    client.release();
 
    const numberOfInvoices = Number(invoiceCountResult.rows[0].count ?? '0');
    const numberOfCustomers = Number(customerCountResult.rows[0].count ?? '0');
    const totalPaidInvoices = formatCurrency(invoiceStatusResult.rows[0].paid ?? '0');
    const totalPendingInvoices = formatCurrency(invoiceStatusResult.rows[0].pending ?? '0');
 
    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}
 
const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(query: string, currentPage: number) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
 
  try {
    const client = await pool.connect();
    const result = await client.query<InvoicesTable>(`
      SELECT
        invoices.id,
        invoices.amount,
        invoices.date,
        invoices.status,
        customers.name,
        customers.email,
        customers.image_url
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE
        customers.name ILIKE $1 OR
        customers.email ILIKE $1 OR
        invoices.amount::text ILIKE $1 OR
        invoices.date::text ILIKE $1 OR
        invoices.status ILIKE $1
      ORDER BY invoices.date DESC
      LIMIT $2 OFFSET $3
    `, [`%${query}%`, ITEMS_PER_PAGE, offset]);
    client.release();
 
    return result.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}
 
export async function fetchInvoicesPages(query: string) {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT COUNT(*)
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE
        customers.name ILIKE $1 OR
        customers.email ILIKE $1 OR
        invoices.amount::text ILIKE $1 OR
        invoices.date::text ILIKE $1 OR
        invoices.status ILIKE $1
    `, [`%${query}%`]);
    client.release();
 
    const totalPages = Math.ceil(Number(result.rows[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}
 
export async function fetchInvoiceById(id: string) {
  try {
    const client = await pool.connect();
    const result = await client.query<InvoiceForm>(`
      SELECT
        invoices.id,
        invoices.customer_id,
        invoices.amount,
        invoices.status
      FROM invoices
      WHERE invoices.id = $1
    `, [id]);
    client.release();
 
    const invoice = result.rows.map((invoice) => ({
      ...invoice,
      amount: invoice.amount / 100,
    }));
 
    return invoice[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}
 
export async function fetchCustomers() {
  try {
    const client = await pool.connect();
    const result = await client.query<CustomerField>(`
      SELECT
        id,
        name
      FROM customers
      ORDER BY name ASC
    `);
    client.release();
 
    return result.rows;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}
 
export async function fetchFilteredCustomers(query: string) {
  try {
    const client = await pool.connect();
    const result = await client.query<CustomersTableType>(`
      SELECT
        customers.id,
        customers.name,
        customers.email,
        customers.image_url,
        COUNT(invoices.id) AS total_invoices,
        SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
        SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
      FROM customers
      LEFT JOIN invoices ON customers.id = invoices.customer_id
      WHERE
        customers.name ILIKE $1 OR
        customers.email ILIKE $1
      GROUP BY customers.id, customers.name, customers.email, customers.image_url
      ORDER BY customers.name ASC
    `, [`%${query}%`]);
    client.release();
 
    const customers = result.rows.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));
 
    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}
