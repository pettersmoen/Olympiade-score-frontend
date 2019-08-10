import React, { Component, useEffect, useState } from 'react';
import styled from 'styled-components';

import withLogin from '../../hoc/withLogin/withLogin';
import { RouteComponentProps } from 'react-router';
import toast from '../../utils/toast/toast';
import io from '../../utils/socket/socket';
import axios from '../../utils/axios';
import { Input, Modal } from '@material-ui/core';
import { Forening } from '../../store/reducers/admin';

const socket = io('/admin');

const TableContainer = styled.div`
  width: 100%;
  display: flex;
  flex-flow: column;
`;

const TableRow = styled.div`
  width: 100%;
  min-height: 3em;
  display: grid;
  grid-template-columns: 2em 1fr 1fr 1fr 4em;
  grid-column-gap: 1em;
  align-items: center;
  border-bottom: 1px solid #ccc;
`;

interface ForeningProps {
  foreninger: Forening[];
  onSubmit: (value: Forening) => void;
  addForening: (data: Pick<Forening, 'name' | 'role'>) => void;
}

const roleOptions = ['admin', 'forening'];
const foreningHeader = ['Id', 'Navn', 'Rolle', 'Passord'];

const RoleSelect = ({
  onChange,
  value,
}: Pick<
  React.DetailedHTMLProps<
    React.SelectHTMLAttributes<HTMLSelectElement>,
    HTMLSelectElement
  >,
  'onChange' | 'value'
>) => (
  <select value={value} onChange={onChange}>
    {roleOptions.map(val => (
      <option key={val}>{val}</option>
    ))}
  </select>
);

const ForeningTableRow = ({
  forening,
  onSubmit,
}: {
  forening: Forening;
  onSubmit: (value: Forening) => void;
}) => {
  const [values, setValues] = useState({
    name: forening.name,
    role: forening.role,
    password: forening.password,
  });
  const { name, role, password } = values;
  return (
    <TableRow>
      <span>{forening.id}</span>
      <Input
        value={name}
        onChange={e => setValues({ ...values, name: e.target.value })}
      />
      <RoleSelect
        onChange={e => setValues({ ...values, role: e.target.value })}
        value={role}
      />
      <Input
        value={password}
        onChange={e => setValues({ ...values, password: e.target.value })}
      />
      <button
        disabled={
          name === forening.name &&
          role === forening.role &&
          password === forening.password
        }
        onClick={() => onSubmit({ ...forening, ...values })}
      >
        Lagre
      </button>
    </TableRow>
  );
};

const NyForeningContainer = styled.div`
  width: 80%;
  height: 60%;
  margin: auto;
  margin-top: 2em;
  background-color: #eee;
  display: flex;
  flex-flow: column;
  align-items: center;
  padding: 2em;
  border-radius: 3px;
`;

const NyForeningModal = ({
  onSubmit,
}: {
  onSubmit: (value: Pick<Forening, 'name' | 'role'>) => void;
}) => {
  const [formValues, setFormValues] = useState({ name: '', role: 'forening' });
  return (
    <NyForeningContainer>
      <h1>Dab</h1>
      <span>Navn</span>
      <Input
        value={formValues.name}
        onChange={e => setFormValues({ ...formValues, name: e.target.value })}
      />
      <span>Rolle</span>
      <RoleSelect
        onChange={e => setFormValues({ ...formValues, role: e.target.value })}
        value={formValues.role}
      />
      <button onClick={() => onSubmit(formValues)}>Lagre</button>
    </NyForeningContainer>
  );
};

const ForeningTable = ({
  foreninger,
  onSubmit,
  addForening,
}: ForeningProps) => {
  const [showModal, setShowModal] = useState(false);
  return (
    <TableContainer>
      <TableRow>
        {foreningHeader.map(val => (
          <span key={val}>
            <strong>{val}</strong>
          </span>
        ))}
      </TableRow>
      {foreninger.map(forening => (
        <ForeningTableRow forening={forening} onSubmit={onSubmit} />
      ))}

      <button onClick={() => setShowModal(true)}>Legg til forening</button>
      <Modal open={showModal}>
        <NyForeningModal
          onSubmit={value => {
            setShowModal(false);
            addForening(value);
          }}
        />
      </Modal>
    </TableContainer>
  );
};

const AdminView = (props: AdminViewProps) => {
  const [foreninger, setForeninger] = useState<Forening[]>([]);
  console.log('render', foreninger);
  useEffect(() => {
    socket.emit('forening_request', (data: Forening[]) => {
      setForeninger(data);
    });

    socket.on('forening_update', (val: Forening) => {
      console.log('forening_update');
      console.log(foreninger, val);
      const i = foreninger.findIndex(({ id }) => id === val.id);
      if (i === -1) setForeninger([...foreninger, val]);
      else {
        const oppdatterteForeninger = [...foreninger];
        oppdatterteForeninger[i] = val;
        console.log('Oppdaterte foreninger: ', oppdatterteForeninger);
        setForeninger(oppdatterteForeninger);
      }
    });
  }, []);

  return (
    <div>
      <h1>Configs</h1>
      <ForeningTable
        foreninger={foreninger}
        onSubmit={forening => {
          axios.put('/api/admin/forening', forening);
        }}
        addForening={(data: { name: string; role: string }) => {
          axios.post('/api/admin/forening', data);
        }}
      />
    </div>
  );
};

interface AdminViewProps extends RouteComponentProps {}

export default withLogin(AdminView, ['admin']);
