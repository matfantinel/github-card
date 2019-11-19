import { GithubUserData } from "./user-data";

export class GithubRepoData {
    id: number;
    name: string;
    full_name: string;
    owner: GithubUserData;
    fork: boolean;
    html_url: string;
    created_at: Date;
    updated_at: Date;
    language: string;
    stargazers_count: number;
    forks_count;
}