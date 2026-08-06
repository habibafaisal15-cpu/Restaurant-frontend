import { formatPhone } from '../../../utils/format';

function RiderInfo({ rider }) {
  if (!rider) {
    return <p>Waiting for rider assignment from restaurant admin...</p>;
  }

  return (
    <div className="rider-info">
      <h3>Your rider</h3>
      <p>Name: {rider.name}</p>
      <p>Phone: {formatPhone(rider.phone)}</p>
      {rider.vehicleNumber && <p>Vehicle: {rider.vehicleNumber}</p>}
    </div>
  );
}

export default RiderInfo;
