import React from 'react';
import '../css/reset.css';
import '../css/app.css';
import ReplacementForm from '../components/ReplacementForm';
import { CenterModal } from '../components/centerModal';
export default function Replacement() {
    return (
        <CenterModal title='Replacement Form' child={(<ReplacementForm />)} />
    )
}