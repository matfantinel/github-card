import { Component, Host, h, Prop } from "@stencil/core";
import { GithubUserData } from "../../models/user-data";
import { GithubRepoData } from "../../models/repo-data";
import { getUserDummyData, getReposDummyData } from "../../utils/dummy-data";

@Component({
  tag: "github-user-card",
  styleUrl: "github-user-card.scss",
  shadow: true
})
export class GithubCard {
  @Prop() username: string;
  @Prop() testMode: boolean;

  userData: GithubUserData;
  repoData: GithubRepoData[];
  starsTotalCount: number;
  rateExceeded: boolean;

  private _maxPerPage: number = 100;

  componentWillLoad() {
    if (!this.username) {
      console.error("No username was provided");
      return;
    }

    return this.fetchUserData();
  }

  fetchUserData() {
    if (this.testMode) {
      this.userData = getUserDummyData();
      this.repoData = getReposDummyData();
      this.starsTotalCount = this.repoData.reduce(
        (sum, current) => sum + current.stargazers_count,
        0
      );
    } else {
      let request = fetch(`https://api.github.com/users/${this.username}`);

      return request
        .then(response => response.json() as Promise<GithubUserData>)
        .then(async data => {
          if (
            (data as any).message &&
            (data as any).message.indexOf("API rate limit exceeded")
          ) {
            this.rateExceeded = true;
          } else {
            this.userData = data;
            this.repoData = await this.fetchUserRepos(this.userData.repos_url);
            if (this.repoData) {
              this.starsTotalCount = this.repoData.reduce(
                (sum, current) => sum + current.stargazers_count,
                0
              );
            }
          }
        });
    }
  }

  fetchUserRepos(reposUrl: string, page: number = 1) {
    return new Promise<Array<GithubRepoData>>(resolve => {
      let result = new Array<GithubRepoData>();

      let request = fetch(
        `${reposUrl}?sort=stars&order=desc&per_page=${this._maxPerPage}&page=${page}`
      );

      request
        .then(response => response.json() as Promise<GithubRepoData[]>)
        .then(async data => {
          result = result.concat(data);

          if (data.length >= this._maxPerPage) {
            page++;
            result.concat(await this.fetchUserRepos(reposUrl, page));
          }

          resolve(result);
        });
    });
  }

  render() {
    return (
      <div class="guc_card">
        {this.userData.avatar_url ? (
          <div class="guc_card-avatar">
            <img src={this.userData.avatar_url}></img>
          </div>
        ) : (
          ""
        )}

        <div class="guc_card-details">
          <div class="guc_name">{this.userData.name}</div>

          {this.userData.company ? (
            <div class="guc_works-for">
              <svg class="icon" viewBox="0 0 16 16" version="1.1" aria-hidden="true"><path fill-rule="evenodd" d="M16 12.999c0 .439-.45 1-1 1H7.995c-.539 0-.994-.447-.995-.999H1c-.54 0-1-.561-1-1 0-2.634 3-4 3-4s.229-.409 0-1c-.841-.621-1.058-.59-1-3 .058-2.419 1.367-3 2.5-3s2.442.58 2.5 3c.058 2.41-.159 2.379-1 3-.229.59 0 1 0 1s1.549.711 2.42 2.088C9.196 9.369 10 8.999 10 8.999s.229-.409 0-1c-.841-.62-1.058-.59-1-3 .058-2.419 1.367-3 2.5-3s2.437.581 2.495 3c.059 2.41-.158 2.38-1 3-.229.59 0 1 0 1s3.005 1.366 3.005 4z"></path></svg>
              {this.userData.company}
            </div>
          ) : (
            ""
          )}
          <div class="guc_home-location">
            <svg class="icon" viewBox="0 0 12 16" version="1.1" width="12" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M6 0C2.69 0 0 2.5 0 5.5 0 10.02 6 16 6 16s6-5.98 6-10.5C12 2.5 9.31 0 6 0zm0 14.55C4.14 12.52 1 8.44 1 5.5 1 3.02 3.25 1 6 1c1.34 0 2.61.48 3.56 1.36.92.86 1.44 1.97 1.44 3.14 0 2.94-3.14 7.02-5 9.05zM8 5.5c0 1.11-.89 2-2 2-1.11 0-2-.89-2-2 0-1.11.89-2 2-2 1.11 0 2 .89 2 2z"></path></svg>            
            {this.userData.location}
          </div>
          <div class="guc_indicators">
            <div class="guc_item">
              <span class="guc_value">{this.starsTotalCount}</span>
              <span class="guc_label">Stars</span>
            </div>
            <div class="guc_item">
              <span class="guc_value">{this.userData.public_repos}</span>
              <span class="guc_label">Repos</span>
            </div>
            <div class="guc_item">
              <span class="guc_value">{this.userData.followers}</span>
              <span class="guc_label">Followers</span>
            </div>
          </div>
          {this.userData.bio ? (
            <div class="guc_bio">{this.userData.bio}</div>
          ) : (
            ""
          )}
        </div>
      </div>
    );
  }
}
