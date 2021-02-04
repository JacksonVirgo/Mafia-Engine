import React, { Component } from 'react'
import { websocketUrl } from '../scripts/websockets';
import { getCalendarDate } from '../scripts/dateUtilities';

const ws = new WebSocket(websocketUrl);
export class ReplacementForm extends Component {
    constructor(props) {
        super(props);
        this.state = {}

        this.resultRef = React.createRef();
        ws.addEventListener('open', () => {
            console.log("Connected to WebSocket");
            ws.send(JSON.stringify({ cmd: "ping" }));
        });
        ws.addEventListener('message', e => {
            try {
                const json = JSON.parse(e.data);
                if (json.cmd === 'replacement')
                    this.postResponse(json.data);
            } catch (err) {
                console.log(err);
                console.log(e);
            }
        });
    }
    async submit(event) {
        event.preventDefault();
        const gameThread = event.target.gameThread.value;
        const departingPlayer = event.target.departingPlayer.value;
        const request = {
            cmd: 'replacement', data: {
                gameThread: gameThread,
                departingPlayer: departingPlayer
            }
        };

        ws.send(JSON.stringify(request));
    }
    postResponse(data) {
        const { author, lastPage, title, url } = data.replacement;
        const departingPlayer = data.departingPlayer;
        let today = getCalendarDate();
        let result = `${today}\n[i][url=${url}]${title}[/url][/i]\n[b]Moderator:[/b] [user]${author}[/user][tab]3[/tab][tab]3[/tab][b]Status:[/b] ${lastPage} pages [tab]3[/tab] [b]Replacing:[/b] [user]${departingPlayer}[/user]`;
        this.resultRef.current.value = result;
    }
    render() {
        return (
            <form onSubmit={this.submit}>
                <label htmlFor='gameThread'>Link to Game Thread</label>
                <input id='gameThread' name='gameThread' type='text' />
                <br />
                <label htmlFor='departingPlayer'>Departing Player</label>
                <input id='departingPlayer' name='departingPlayer' type='text' />
                <br />
                <a>+1</a>
                <br />
                <input type='submit' value='Generate' />
                <br />
                <h2>Result</h2>
                <textarea name='result' ref={this.resultRef} readOnly />
            </form>
        )
    }
}

export default ReplacementForm