const getters = {
  isMobile: state => state.app.isMobile,
  lang: state => state.app.lang,
  theme: state => state.app.theme,
  color: state => state.app.color,
  token: state => state.user.token,
  avatar: state => state.user.avatar,
  nickname: state => state.user.name,
  welcome: state => state.user.welcome,
  roles: state => state.user.roles,
  userInfo: state => state.user.info,
  multiTab: state => state.app.multiTab,
  can: state => (permission, target, id) => {
    id = +id // convert id to integer.
    console.log(permission, target, id)
    for (const role of state.user.info.roles) {
      if (target !== undefined && id !== undefined) {
        if (role.target && role.target === target && role.target_id === id) {
          for (const p of role.permissions) {
            if (p.name === 'all' || p.name === permission) {
              console.log(true)
              return true
            }
          }
        } else if (!role.target && !target) {
          for (const permission of role.permissions) {
            if (permission.name === 'all' || permission.name === permission) {
              console.log(true)
              return true
            }
          }
        }
      } else {
        if (role.target === null) {
          for (const p of role.permissions) {
            if (p.name === 'all' || p.name === permission) {
              console.log(true)
              return true
            }
          }
        }
      }
    }
    console.log(false)
    return false
  }
}

export default getters
