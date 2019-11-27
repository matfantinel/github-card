import { Component, Host, h, Prop } from "@stencil/core";
import { GithubUserData } from "../../models/user-data";
import { GithubRepoData } from "../../models/repo-data";

@Component({
  tag: "github-card",
  styleUrl: "github-card.scss",
  shadow: true
})
export class GithubCard {
  @Prop() username: string;

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
      <div class="card">
        {this.userData.avatar_url ? (
          <div class="card-avatar">
            <img src={this.userData.avatar_url}></img>
          </div>
        ) : (
          ""
        )}

        <div class="card-details">
          <div class="name">
            {this.userData.name}
            {this.userData.company ? (
              <span class="works-for">
                &nbsp;-&nbsp;{this.userData.company}
              </span>
            ) : (
              ""
            )}
          </div>
          <div class="detail home-location">{this.userData.location}</div>
          <div class="card-about">
            <div class="item">
              <span class="value">{this.starsTotalCount}</span>
              <span class="label">Stars</span>
            </div>
            <div class="item">
              <span class="value">{this.userData.public_repos}</span>
              <span class="label">Repos</span>
            </div>
            <div class="item">
              <span class="value">{this.userData.followers}</span>
              <span class="label">Followers</span>
            </div>
          </div>
          {this.userData.bio ? (
            <div class="skills">
              <span class="value">{this.userData.bio}</span>
            </div>
          ) : (
            ""
          )}
        </div>
      </div>
    );
  }
}
