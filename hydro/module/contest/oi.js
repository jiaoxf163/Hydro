module.exports = {
    check: () => { },
    stat: (tdoc, journal) => {
        let detail = {}, score = 0;
        for (let j in journal)
            if (tdoc.pids.includes(j.pid)) {
                detail[j.pid] = j;
                score += j.score;
            }
        return { score, detail };
    },
    scoreboard(is_export, _, tdoc, ranked_tsdocs, udict, dudict, pdict) {
        let columns = [
            { type: 'rank', value: _('Rank') },
            { type: 'user', value: _('User') },
            { type: 'display_name', value: _('Display Name') },
            { type: 'total_score', value: _('Total Score') }
        ];
        for (let i in tdoc.pids)
            if (is_export)
                columns.push({ type: 'problem_score', value: '#{0} {1}'.format(i + 1, pdict[tdoc.pids[i]].title) });
            else
                columns.push({
                    type: 'problem_detail',
                    value: '#{0}'.format(i + 1),
                    raw: pdict[tdoc.pids[i]]
                });
        let rows = [columns];
        for (let [rank, tsdoc] of ranked_tsdocs) {
            let tsddict = {};
            if (tdoc.detail)
                for (let item of tsdoc.detail)
                    tsddict[item.pid] = item;
            let row = [];
            row.push({ type: 'string', value: rank });
            row.push({ type: 'user', value: udict[tsdoc.uid].uname, raw: udict[tsdoc.uid] });
            row.push({ type: 'display_name', value: dudict[tsdoc.uid].display_name || '' });
            row.push({ type: 'string', value: tsdoc.score || 0 });
            for (let pid of tdoc.pids)
                row.push({
                    type: 'record',
                    value: (tsddict[pid] || {}).score || '-',
                    raw: (tsddict[pid] || {}).rid || null
                });
            rows.push(row);
        }
        return rows;
    }
};