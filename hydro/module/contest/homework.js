const { ValidationError } = require('../../error');
module.exports = {
    check(data) {
        if (!data.penalty_since) throw new ValidationError('penalty_since');
        if (data.penalty_since < data.begin_at) throw new ValidationError('penalty_since', 'begin_at');
        if (data.penalty_since > data.end_at) throw new ValidationError('penalty_since', 'end_at');
    },
    stat(tdoc, journal) {
        let effective = {}, detail = [], score = 0, penalty_score = 0, time = 0;
        for (let j in journal)
            if (tdoc.pids.includes(j.pid) && !(effective.includes(j.pid) && effective[j.pid].accept))
                effective[j.pid] = j;
        const _time = jdoc => jdoc.rid.generationTime - Math.floor(tdoc.begin_at / 1000);
        function _penalty_score(jdoc) {
            let exceed_seconds = jdoc.rid.generation_time - Math.floor(tdoc.penalty_since / 1000);
            if (exceed_seconds < 0) return jdoc.score;
            else return 0.5 * jdoc.score;
        }
        for (let j in effective) {
            detail.push(Object.assign({}, effective[j], {
                penalty_score: _penalty_score(effective[j]), time: _time(effective[j])
            }));
        }
        for (let d of detail) {
            score += d.score;
            penalty_score += d.penalty_score;
            time += d.time;
        }
        return { score, penalty_score, time, detail };
    },
    scoreboard(is_export, _, tdoc, ranked_tsdocs, udict, dudict, pdict) {
        let columns = [
            { 'type': 'rank', 'value': _('Rank') },
            { 'type': 'user', 'value': _('User') },
            { 'type': 'display_name', 'value': _('Display Name') },
            { 'type': 'total_score', 'value': _('Score') }
        ];
        if (is_export)
            columns.push(
                { type: 'total_original_score', value: _('Original Score') },
                { type: 'total_time', value: _('Total Time (Seconds)') }
            );
        columns.push({ type: 'total_time_str', value: _('Total Time') });
        for (let i in tdoc.pids)
            if (is_export)
                columns.push(
                    { type: 'problem_score', value: '#{0} {1}'.format(i + 1, pdict[tdoc.pids[i]].title) },
                    { type: 'problem_original_score', value: '#{0} {1}'.format(i + 1, _('Original Score')) },
                    { type: 'problem_time', value: '#{0} {1}'.format(i + 1, _('Time (Seconds)')) },
                    { type: 'problem_time_str', value: '#{0} {1}'.format(i + 1, _('Time')) }
                );
            else columns.push({ type: 'problem_detail', value: '#{0}'.format(i + 1), 'raw': pdict[tdoc.pids[i]] });
        let rows = [columns];
        for (let [rank, tsdoc] in ranked_tsdocs) {
            let tsddict = {};
            if (tsdoc.detail)
                for (let item of tsdoc.detail)
                    tsddict[item.pid] = item;
            let row = [
                { type: 'string', value: rank },
                { type: 'user', value: udict[tsdoc.uid].uname, raw: udict[tsdoc.uid] },
                { type: 'display_name', value: (dudict[tsdoc.uid] || {}).display_name || '' },
                { type: 'string', value: tsdoc.penalty_score || 0 }
            ];
            if (is_export)
                row.push(
                    { type: 'string', value: tsdoc.score || 0 },
                    { type: 'string', value: tsdoc.time || 0.0 }
                );
            row.push({ type: 'string', value: tsdoc.time || 0 });
            for (let pid of tdoc.pids) {
                let rdoc = (tsddict[pid] || {}).rid || null;
                let col_score = (tsddict[pid] || {}).penalty_score || '-';
                let col_original_score = (tsddict[pid] || {}).score || '-';
                let col_time = (tsddict[pid] || {}).time || '-';
                let col_time_str = col_time != '-' ? col_time : '-';
                if (is_export) row.push(
                    { type: 'string', value: col_score },
                    { type: 'string', value: col_original_score },
                    { type: 'string', value: col_time },
                    { type: 'string', value: col_time_str },
                );
                else row.push({
                    type: 'record',
                    value: '{0} / {1}\n{2}'.format(col_score, col_original_score, col_time_str),
                    raw: rdoc
                });
            }
            rows.push(row);
        }
        return rows;
    }
};