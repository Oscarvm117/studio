'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { useDoc } from '@/firebase/firestore/use-doc';
import type { Lot } from '@/lib/types';
import { format } from 'date-fns';

export default function TraceabilityPage() {
  const searchParams = useSearchParams();
  const { firestore } = useFirebase();

  const lotId = searchParams.get('lotId');
  const farmerId = searchParams.get('farmerId');

  const [lotRef, setLotRef] = useState<any>(null);

  useEffect(() => {
    if (lotId && farmerId) {
      setLotRef(doc(firestore, 'users', farmerId, 'lots', lotId));
    }
  }, [lotId, farmerId, firestore]);

  const { data: lot, isLoading, error } = useDoc<Lot>(lotRef);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Cargando información del lote...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen">Error al cargar la información del lote.</div>;
  }

  if (!lot) {
    return <div className="flex items-center justify-center h-screen">Lote no encontrado.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Información de Trazabilidad del Lote</h1>
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Producto</p>
            <p className="text-lg font-semibold">{lot.productType}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Cantidad</p>
            <p className="text-lg font-semibold">{lot.quantity} {lot.unit}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Fecha de Cosecha</p>
            <p className="text-lg font-semibold">{format(new Date(lot.harvestDate), 'PPP')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Ubicación</p>
            <p className="text-lg font-semibold">{lot.location}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Agricultor</p>
            <p className="text-lg font-semibold">{lot.farmerName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Precio por Kg</p>
            <p className="text-lg font-semibold">COP ${lot.pricePerKg}</p>
          </div>
          {lot.certifications && lot.certifications.length > 0 && (
            <div className="col-span-2">
              <p className="text-sm text-gray-500">Certificaciones</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {lot.certifications.map(cert => (
                  <span key={cert} className="px-2 py-1 bg-green-200 text-green-800 rounded-full text-sm">{cert}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
