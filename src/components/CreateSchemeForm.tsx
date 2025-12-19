'use client';

import { useState } from 'react';

type SchemePart = {
  part_index: number;
  label: string;
  percent: number;
  destination_kind: 'earner' | 'account';
  destination_id: string;
};

export default function CreateSchemeForm({
  employerId,
}: {
  employerId: string;
}) {
  const [name, setName] = useState('');
  const [parts, setParts] = useState<SchemePart[]>([
    { part_index: 1, label: '', percent: 0, destination_kind: 'earner', destination_id: '' },
  ]);

  const addPart = () => {
    setParts([...parts, {
      part_index: parts.length + 1,
      label: '',
      percent: 0,
      destination_kind: 'earner',
      destination_id: ''
    }]);
  };

  const updatePart = <K extends keyof SchemePart>(
    i: number,
    field: K,
    value: SchemePart[K]
  ) => {
    const copy = [...parts];
    copy[i] = {
      ...copy[i],
      [field]: value,
    };
    setParts(copy);
  };

  const handleCreate = async () => {
    const res = await fetch('/api/employers/schemes/create', {
      method: 'POST',
      body: JSON.stringify({
        employer_id: employerId,
        name,
        parts
      })
    });

    const data = await res.json();
    console.log(data);
    alert(data.success ? 'Схема создана!' : data.error);
  };

  return (
    <div className="p-4 border rounded space-y-3">
      <h3 className="font-semibold">Новая схема распределения</h3>

      <input
        className="border p-2 rounded w-full"
        placeholder="Название схемы"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      {parts.map((p, i) => (
        <div key={i} className="border p-2 rounded space-y-1">
          <p>Часть {i + 1}</p>
          <input
            className="border p-1 rounded w-full"
            placeholder="Название"
            onChange={(e) => updatePart(i, 'label', e.target.value)}
          />

          <input
            className="border p-1 rounded w-full"
            placeholder="%"
            type="number"
            onChange={(e) => updatePart(i, 'percent', Number(e.target.value))}
          />

          <select
            className="border p-1 rounded w-full"
            onChange={(e) =>
              updatePart(
                i,
                'destination_kind',
                e.target.value as 'earner' | 'account'
              )
            }
          >
            <option value="earner">Работник</option>
            <option value="account">Аккаунт компании</option>
          </select>

          <input
            className="border p-1 rounded w-full"
            placeholder="ID получателя"
            onChange={(e) => updatePart(i, 'destination_id', e.target.value)}
          />
        </div>
      ))}

      <button className="bg-gray-300 px-3 py-1 rounded" onClick={addPart}>
        + Добавить часть
      </button>

      <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={handleCreate}>
        Создать
      </button>
    </div>
  );
}
