import React from 'react';
import { connectSocket } from '../../network/socket.js';
import Vote from '../../scripts/Vote.js';
import { sortArraysBySize } from '../../scripts/sorting.js';
import { findBestMatch } from 'string-similarity';
import Form from '../forms/Form.jsx';
import Modal from './Modal';
import settings from '../../scripts/formatting/settingsFormatter';

/*
 */

export default class VoteCount extends React.Component {
    constructor() {
        super();
        this.state = {
            progress: '',
            result: '',
        };
        this.toggle = {
            onlyCountVotes: false,
        };
        this.cache = {};
        this.socket = null;

        for (const cat in this.toggle) {
            this.state[cat] = this.toggle[cat];
        }
    }
    componentDidMount() {
        this.startSocketConnection();
        this.setupSocketListeners();
    }
    componentWillUnmount() {
        this.closeSocketConnection();
    }
    startSocketConnection() {
        this.socket = connectSocket();
    }
    closeSocketConnection() {
        this.socket.disconnect();
    }
    setupSocketListeners() {
        this.socket.on('result', this.processVotes.bind(this));
        this.socket.on('progress', this.processProgress.bind(this));
        this.socket.on('error', this.processError.bind(this));
    }
    processVotes(data) {
        data.settings = settings(data.settings);
        this.cache = Object.assign(this.cache, data);
        const cleaned = this.clean();
        if (cleaned) {
            const format = this.format(cleaned);
            this.setState({ progress: '', result: format });
        } else {
            this.setState({ progress: '[ERROR]', result: 'Thread is not compatible with this tool.' });
        }
    }
    processProgress(data) {
        const { currentPage, lastPage, notes } = data;
        if (currentPage && lastPage) {
            this.setState({ progress: `[${Math.round((data.currentPage / data.lastPage) * 100)}%]` });
        }
        if (notes) {
            this.setState({ result: `${notes}` });
        }
    }
    processError(data) {
        this.setState({ progress: '[ERROR]', result: data.type });
    }
    onFormSubmit(e) {
        e.preventDefault();
        let gameUrl = e.target.url.value;
        this.socket.emit('genVoteCount', { url: gameUrl });
        this.setState({ progress: '[0%]', result: 'Pending Result...' });
    }
    onAddField(fields) {
        console.log(fields);
    }
    render() {
        return (
            <Modal
                title='Vote Counter'
                children={[
                    <Form
                        key='votecountForm'
                        onSubmit={this.onFormSubmit.bind(this)}
                        submitText='Generate Vote Count'
                        children={[
                            {
                                name: 'url',
                                label: 'Game URL',
                                type: 'text',
                            },
                        ]}
                    />,

                    <div key='result' className='modalResult'>
                        <h3>
                            Result <span>{this.state.progress}</span>
                        </h3>
                        <textarea value={this.state.result} readOnly />
                    </div>,
                ]}
            />
        );
    }
    clean() {
        const isValid = this.cache.settings.players.length >= 1;
        const voteData = {
            votes: {},
            wagons: {},
            orderedWagons: [],
            notVoting: [],
            majority: null,
        };
        if (isValid) {
            for (const category in this.cache.voteCount) {
                if (!voteData.votes[category]) voteData.votes[category] = {};
                if (!voteData.wagons[category]) voteData.wagons[category] = {};
                let hammerOccured = false;
                voteData.notVoting = this.getAlive();
                voteData.majority = Math.ceil(voteData.notVoting.length / 2);
                for (const author in this.cache.voteCount[category]) {
                    if (!hammerOccured) {
                        let voteArray = this.cache.voteCount[category][author];
                        let lastVote = null;
                        let validVote = null;
                        for (let i = 0; i < voteArray.length; i++) {
                            let vote = new Vote(voteArray[i], category);
                            vote.clean(this.cache.settings);
                            if (vote.vote.valid !== undefined) {
                                if (vote.vote.valid) {
                                    validVote = vote.getNewest(validVote);
                                } else {
                                    validVote = null;
                                }
                            }
                            lastVote = vote.getNewest(lastVote);
                        }

                        let valid = validVote?.isValid(this.cache.settings);
                        if (valid && !hammerOccured) {
                            let authorIndex = voteData.notVoting.indexOf(validVote.author);
                            voteData.notVoting.splice(authorIndex, 1);
                            voteData.votes[category][author] = {
                                last: lastVote,
                                valid: validVote,
                            };
                            if (!voteData.wagons[category][validVote.vote.valid]) voteData.wagons[category][validVote.vote.valid] = [];

                            let wagons = voteData.wagons[category][validVote.vote.valid];
                            wagons.push(validVote);
                            wagons = sortArraysBySize(wagons);
                            voteData.wagons[category][validVote.vote.valid] = wagons;
                        }
                    }
                }
                for (const wagonHandle in voteData.wagons[category]) {
                    let wagon = this.sortWagonByPostNumber(voteData.wagons[category][wagonHandle]);
                    if (!voteData.orderedWagons[category]) voteData.orderedWagons[category] = [];
                    if (!voteData.orderedWagons[category][wagon.length]) voteData.orderedWagons[category][wagon.length] = {};
                    voteData.orderedWagons[category][wagon.length][wagonHandle] = wagon;
                }
                voteData.orderedWagons[category].reverse();
                console.log(voteData.orderedWagons);
            }
        }
        let returnVal = this.cache.settings.players.length;
        return returnVal >= 1 ? voteData : null;
    }
    sortWagonByPostNumber(wagon) {
        let newArray = wagon;
        let length = newArray.length;
        for (let i = 0; i < length; i++) {
            for (let j = 0; j < length - i - 1; j++) {
                if (newArray[j].number > newArray[j + 1].number) {
                    let tmp = newArray[j];
                    newArray[j] = newArray[j + 1];
                    newArray[j + 1] = tmp;
                }
            }
        }
        console.log(newArray);
        return newArray;
    }
    format(voteData) {
        const { wagons, notVoting, orderedWagons, majority } = voteData;
        const { edash, edashOnTop } = this.cache.settings;
        let totalVC = '';

        for (const category in wagons) {
            let categoryVotes = '[area=VC]';

            const wagonArray = orderedWagons[category];
            for (let i = 0; i < wagonArray.length; i++) {
                for (const wagonHead in wagonArray[i]) {
                    let vote = wagonArray[i][wagonHead];
                    let voteStr = `[b]${wagonHead}[/b] (${vote.length}) -> `;
                    for (let i = 0; i < vote.length; i++) {
                        if (i > 0) voteStr += ', ';
                        voteStr += `${vote[i].author}`;
                    }
                    let eDash = majority - vote.length;
                    const showEdash = i <= edashOnTop - 1 || eDash <= edash;
                    if (showEdash) voteStr += eDash <= 0 ? ' [ELIMINATED]' : ` [E-${eDash}]`;
                    categoryVotes += `${voteStr}\n`;
                }
            }
            if (notVoting.length > 0) {
                categoryVotes += `\n[b]Not Voting[/b] (${notVoting.length}) -> `;
                for (let i = 0; i < notVoting.length; i++) {
                    if (i > 0) categoryVotes += ', ';
                    categoryVotes += `${notVoting[i]}`;
                }
            }
            categoryVotes += `${this.cache.settings.deadline ? `\nDay ends in [countdown]${this.cache.settings.deadline}[/countdown]` : ''}[/area]`;
            totalVC += categoryVotes;
        }
        return totalVC;
    }
    getAlive() {
        const { players, dead } = this.cache.settings;
        let aliveList = [];
        for (let i = 0; i < players.length; i++) {
            let root = this.getRootAuthor(players[i]);
            if (!containsObject(root, aliveList) && !containsObject(root, dead)) {
                aliveList.push(root);
            }
        }
        return aliveList;
    }
    checkValid(votePost, category) {
        let isCurrent = votePost.number > parseInt(this.cache.settings.days[this.cache.settings.days.length - 1]);
        let isDead = false;
        for (let deadUsr of this.cache.settings.dead) {
            let deadRoot = this.rootUser(deadUsr);
            let userRoot = this.rootUser(votePost.author);
            if (deadRoot.target === userRoot.target) {
                isDead = true;
            }
        }
        return isCurrent && !isDead;
    }
    isValidVote(vote) {
        let valid = false;
        if (vote) {
            let cor = this.rootUser(vote);
            if (cor.rating >= this.cache.settings.correctionWeight || 0.7) {
                let correctedVote = this.cache.settings.alias[cor.target];
                if (correctedVote) {
                    valid = true;
                }
            }
        }
        return valid;
    }
    rootUser(user) {
        return findBestMatch(user, this.cache.settings.totalnames).bestMatch;
    }
    getRootAuthor(author) {
        let bestMatch = findBestMatch(author, this.cache.settings.totalnames).bestMatch;
        let root = this.cache.settings.alias[bestMatch.target];
        return root || bestMatch.target;
    }
}

function containsObject(obj, list) {
    for (let i = 0; i < list.length; i++) {
        if (list[i] === obj) return true;
    }
    return false;
}
