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
          <div class="guc_name">
            {this.userData.name}
            {this.userData.company ? (
              <span class="guc_works-for">
                &nbsp;-&nbsp;{this.userData.company}
              </span>
            ) : (
              ""
            )}
          </div>
          <div class="guc_home-location">{this.userData.location}</div>
          <div class="guc_card-about">
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
            <div class="guc_skills">
              <span class="guc_value">{this.userData.bio}</span>
            </div>
          ) : (
            ""
          )}
        </div>
      </div>
    );
  }
}
