import { Component, Host, h, Prop } from '@stencil/core';
import { GithubUserData } from '../../models/user-data';
import { GithubRepoData } from '../../models/repo-data';

@Component({
  tag: 'github-card',
  styleUrl: 'github-card.scss',
  shadow: true
})
export class GithubCard {
  @Prop() username: string;

  userData: GithubUserData;
  repoData: GithubRepoData[];
  rateExceeded: boolean;

  componentWillLoad() {
    if (!this.username) {
      console.error('No username was provided');
      return;
    }

    return this.fetchUserData();
  }

  fetchUserData() {
    let request = fetch(`https://api.github.com/users/${this.username}`);

    return request
      .then(response => response.json() as Promise<GithubUserData>)
      .then(async data => {
        if ((data as any).message.indexOf('API rate limit exceeded')) {
          this.rateExceeded = true;
        } else {
          this.userData = data;
          await this.fetchUserRepos(this.userData.repos_url);
        }
      });
  }

  fetchUserRepos(reposUrl: string) {
    return new Promise<void>(resolve => {
      debugger
      let result = new Array<GithubRepoData>();
      let maxPerPage = 100;
      let keepFetching = true;
      let page = 1;

      // while (keepFetching) {
        let request = fetch(`${reposUrl}?sort=stars&order=desc&per_page=${maxPerPage}&page=${page}`);

        request
          .then(response => response.json() as Promise<GithubRepoData[]>)
          .then(data => {
            result.concat(data);

            if (data.length < maxPerPage) {
              keepFetching = false;
              resolve();
            } else {
              page++;
            }
          });
      // }
    });
  }

  getStarsTotalCount() {
    return this.repoData.reduce((sum, current) => sum + current.stargazers_count, 0);
  }

  render() {
    return (
      <div class='card'>
        {this.userData.avatar_url ? (
          <div class='card-avatar'>
            <img src={this.userData.avatar_url}></img>
          </div>
        ) : (
          ''
        )}

        <div class='card-details'>
          <div class='name'>
            {this.userData.name}
            {this.userData.company ? <span class='works-for'>&nbsp;-&nbsp;{this.userData.company}</span> : ''}
          </div>
          <div class='detail home-location'>{this.userData.location}</div>

          <div class='card-about'>
            <div class='item'>
              <span class='value'>{this.getStarsTotalCount()}</span>
              <span class='label'>Stars</span>
            </div>
            <div class='item'>
              <span class='value'>{this.userData.public_repos}</span>
              <span class='label'>Repos</span>
            </div>
            <div class='item'>
              <span class='value'>{this.userData.followers}</span>
              <span class='label'>Followers</span>
            </div>
          </div>
          {this.userData.bio ? (
            <div class='skills'>
              <span class='value'>{this.userData.bio}</span>
            </div>
          ) : (
            ''
          )}
        </div>
      </div>
    );
  }
}
