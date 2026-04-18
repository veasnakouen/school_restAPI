import { ProductDto } from '../../services/api';

type Props = {
    products: ProductDto[];
}
 
export default function Catalog({ products }:Props) {
  return (
      <>
          <h1 className="text-2xl font-bold mb-4">Product Catalog</h1>
          <ul>
              {products.map((item) => (
                    <li key={item.id}>{item.name} - ${item.price?.toFixed(2)}</li>
              ))}
          </ul>
      </>
  )
}