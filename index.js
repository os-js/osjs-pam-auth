/*
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2019, Anders Evenrud <andersevenrud@gmail.com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 */

const fs = require('fs-extra');
const pam = require('authenticate-pam');

// TODO FIXME We don't need this anymore ?!
const userid = require('userid');

const readNixGroups = () =>
  fs.readFile('/etc/group', 'utf8')
    .then(contents => contents.trim().split('\n'))
    .then(lines => lines.map(line => {
      // eslint-disable-next-line
      const [name, secret, gid, users] = line.split(':');
      return {name, gid, users: users ? users.split(',') : []};
    }));

const readNixPasswd = () =>
  fs.readFile('/etc/passwd', 'utf8')
    .then(contents => contents.trim().split('\n'))
    .then(lines => lines.map(line => {
      // eslint-disable-next-line
      const [name, enc, uid, gid, desc, home, shell] = line.split(':');
      return {name, enc, uid, gid, desc, home, shell};
    }));

const readNativeFile = () => async (username) => {
  const groups = await readNixGroups();
  const passwd = await readNixPasswd();

  const userGroups = groups
    .filter(g => g.users.indexOf(username) !== -1)
    .map(g => g.name);

  const userInfo = passwd
    .find(p => p.name === username);

  const defaultGroup = userInfo
    ? groups.find(g => g.gid === userInfo.gid)
    : null;

  if (defaultGroup) {
    userGroups.push(defaultGroup.name);
  }

  return userGroups;
};

const readCustomFile = options => username =>
  fs.readJson(options.config)
    .then(json => (json[username] || []));

const authenticate = (username, password) =>
  new Promise((resolve, reject) =>
    pam.authenticate(username, password, err =>
      err ? reject(err) : resolve(true)));

const readGroups = options => options.native
  ? readNativeFile(options)
  : readCustomFile(options);

module.exports = (core, options = {}) => ({
  logout: () => Promise.resolve(true),
  login: async (req, res) => {
    const {username, password} = req.body;

    return authenticate(username, password)
      .then(() => {
        const done = groups => {
          const id = userid.uid(username);
          return {id, username, groups};
        };

        return readGroups(Object.assign({
          native: true,
          config: '/etc/osjs/groups.json'
        }, options))(username)
          .then(groups => {
            return done(groups);
          })
          .catch(error => {
            console.warn(error);
            return done([]);
          });
      })
      .catch(error => {
        console.error(error);

        return false;
      });
  }
});
