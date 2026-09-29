import {
  OrderListPage,
  type OrderListParams,
} from '../components/OrderListPage';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<OrderListParams>;
}) {
  return <OrderListPage params={await searchParams} history />;
}
