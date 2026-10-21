import { describe, it, expect } from 'vitest';
import { sortByNewest, filterJobs, formatPostedDate } from './jobs';
import type { Job } from '../types/job';

function makeJob(
    slug: string,
    postedDate: string,
    department = 'Technology',
    location = 'Remote',
): Job {
    return {
        slug,
        title: `Role ${slug}`,
        department,
        location,
        type: 'Full-time',
        remote: true,
        postedDate,
        summary: 'A role.',
    };
}

describe('sortByNewest', () => {
    it('orders jobs by posted date, newest first', () => {
        const jobs = [
            makeJob('a', '2027-01-01'),
            makeJob('b', '2027-03-15'),
            makeJob('c', '2027-02-10'),
        ];
        expect(sortByNewest(jobs).map((j) => j.slug)).toEqual(['b', 'c', 'a']);
    });

    it('does not mutate the input array', () => {
        const jobs = [makeJob('a', '2027-01-01'), makeJob('b', '2027-03-15')];
        const original = jobs.map((j) => j.slug);
        sortByNewest(jobs);
        expect(jobs.map((j) => j.slug)).toEqual(original);
    });
});

describe('filterJobs', () => {
    const jobs = [
        makeJob('frontend', '2027-01-01', 'Technology', 'Remote'),
        makeJob('data', '2027-01-02', 'Technology', 'Woodinville, WA, USA'),
        makeJob('analyst', '2027-01-03', 'Finance', 'Woodinville, WA, USA'),
    ];

    it('filters by department', () => {
        expect(filterJobs(jobs, 'Technology').map((job) => job.slug)).toEqual([
            'frontend',
            'data',
        ]);
    });

    it('filters by location', () => {
        expect(filterJobs(jobs, '', 'Woodinville, WA, USA').map((job) => job.slug)).toEqual([
            'data',
            'analyst',
        ]);
    });

    it('combines department and location filters with AND', () => {
        expect(
            filterJobs(jobs, 'Finance', 'Woodinville, WA, USA').map((job) => job.slug),
        ).toEqual(['analyst']);
    });

    it('returns all jobs when both filters are cleared', () => {
        expect(filterJobs(jobs)).toEqual(jobs);
    });

    it('returns no jobs when no roles match', () => {
        expect(filterJobs(jobs, 'Technology', 'Helsinki, Finland')).toEqual([]);
    });
});

describe('formatPostedDate', () => {
    it('formats an ISO date as a readable string', () => {
        expect(formatPostedDate('2027-01-05')).toBe('January 5, 2027');
    });

    it('returns the raw value when the date is unparseable', () => {
        expect(formatPostedDate('not-a-date')).toBe('not-a-date');
    });
});
