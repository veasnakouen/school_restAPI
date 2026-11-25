import type { ProductDto } from '../../services/api';

export const VEHICLE_FILTER_OPTIONS = [
  { value: '', label: 'All Items' },
  { value: 'Vehicle', label: 'All Vehicles (Motor & Car)' },
  { value: 'Motor', label: 'Motor / Motorcycle' },
  { value: 'Car', label: 'Car / Van / Truck' },
] as const;

const MOTOR_KEYWORDS = ['motor', 'moto', 'scooter', 'motorbike', 'honda', 'yamaha', 'vespa'];
const CAR_KEYWORDS = ['car', 'toyota', 'hilux', 'ford', 'pickup', 'van', 'truck', 'suv', 'sedan', 'bus', 'isuzu', 'mitsubishi'];

export const matchesProductVehicleFilter = (p: ProductDto, vehicleType: string): boolean => {
  if (!vehicleType) return true;
  const name = (p.name || '').toLowerCase();
  const cat = (p.categoryName || '').toLowerCase();

  const isMotor =
    MOTOR_KEYWORDS.some((k) => name.includes(k)) ||
    cat.includes('motor') ||
    cat.includes('moto') ||
    cat.includes('bike');

  const isCar =
    CAR_KEYWORDS.some((k) => name.includes(k)) ||
    cat.includes('car') ||
    cat.includes('auto') ||
    cat.includes('van') ||
    cat.includes('truck') ||
    cat.includes('pickup') ||
    ((cat.includes('vehicle') || cat.includes('transport')) && !cat.includes('motor') && !cat.includes('moto') && !cat.includes('bike'));

  if (vehicleType === 'Motor') return isMotor;
  if (vehicleType === 'Car') return isCar;
  return isMotor || isCar || Boolean(p.plateNumber || p.engineNumber) || cat.includes('vehicle') || cat.includes('transport');
};
