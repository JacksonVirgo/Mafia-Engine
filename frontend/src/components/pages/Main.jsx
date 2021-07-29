import React from 'react';
import logo from '../../img/logo.png';

import { useGlobals } from '../../GlobalProvider';

function renderSubtitle(subtitle) {
    let subtitleCmpt = <h2>{subtitle}</h2>;
    return subtitle ? subtitleCmpt : null;
}

export default function Main(auth) {
    const globalState = useGlobals();
    console.log(globalState.jwt);
    return (
        <div className='modalMain'>
            <img src={logo} alt='Logo' />
            <h1>Mafia Engine</h1>
            {renderSubtitle('Version Beta 1.5')}
            <br />
            <div className='mainmenu'>
                <a className='menuoption' href='/votecount'>
                    Vote Counter
                </a>
                <a className='menuoption' href='/replacement'>
                    Replacement Form
                </a>
                <a className='menuoption' href='/'>
                    Discord Bot [inactive]
                </a>
                <a className='menuoption' href='/credits'>
                    Credits / Contact
                </a>
            </div>
        </div>
    );
}
