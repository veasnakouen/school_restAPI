import React, { useState, useEffect } from 'react';
import { getProducts, ProductDto } from '../../services/api';
import Catalog from "./Catalog";

export default function ProductList() {
    const [products, setProducts] = useState<ProductDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const result = await getProducts({ pageNumber: 1, pageSize: 10 });
                setProducts(result.items);
            } catch (error) {
                console.error("Failed to fetch products for catalog", error);
            } finally {
                setLoading(false);
            }
        };
        void fetchProducts();
    }, []);

    if (loading) {
        return <div>Loading products...</div>;
    }

  return (
      <>
          <h1 style={{color:'red'}}>Re-Store</h1>
          <Catalog products={products} />
      </>
  )
}