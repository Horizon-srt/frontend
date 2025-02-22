<template>
  <a-spin :spinning="problem_loading" class="problem_spin">
    <a-row :gutter="[16,16]" style="height: 100%">
      <a-col :xl="{span:14, offset:2}" :lg="{span:16}" style="height: 100%">
        <a-card :title="problem.name" style="height: 100%">
          <a-skeleton active :loading="problem_loading">
            <markdown v-model="problem.description">
            </markdown>
            <test-case v-for="t in problem.test_cases" :t="t" :key="t.id" :can-read-secret="can_read_secret" v-if="!isGuest"/>
          </a-skeleton>
          <router-link :to="{name: 'problem.edit', params: {id :problem.id}}" slot="extra" v-if="can_edit_problem">
            <a-button>
              <a-icon type="edit"/> 编辑题目
            </a-button>
          </router-link>
        </a-card>
      </a-col>
      <a-col :xl="{span:6}" :lg="{span:8}" >
        <a-space direction="vertical">
          <a-card>
            <a-descriptions title="题目信息" :column="3">
              <a-descriptions-item label="时间限制">
                {{ problem.time_limit }} ms
              </a-descriptions-item>
              <a-descriptions-item label="内存限制">
                {{ problem.memory_limit > 1024 * 1024 ? problem.memory_limit / (1024 * 1024) + " MiB" : problem.memory_limit / 1024 + (" Kib") }}
              </a-descriptions-item>
              <a-descriptions-item label="是否公开" v-if="can_read_problem">
                {{ problem.public ? "是" : "否" }}
              </a-descriptions-item>
              <a-descriptions-item v-else>

              </a-descriptions-item>
              <a-descriptions-item label="允许的语言" :span="3">
                <Language
                  v-for="language in problem.language_allowed"
                  :key="language"
                  :language="language">
                </Language>
              </a-descriptions-item>
              <a-descriptions-item label="答案比较方式" :span="3">
                {{ comparerConf[problem.compare_script_name].name == null ? problem.compare_script_name : comparerConf[problem.compare_script_name].name }}
              </a-descriptions-item>
              <a-descriptions-item label="编译选项" :span="3" v-if="can_read_problem">
                {{ problem.build_arg === "" ? "无" :problem.build_arg }}
              </a-descriptions-item>
              <a-descriptions-item label="附件" :span="3">
                {{ problem.attachment_file_name === "" ? "无" : "" }}
                <a-button :loading="downloading" @click="downloadAttachment()" v-if="problem.attachment_file_name !== ''">
                  <a-icon type="download" />
                  {{ download_message }}</a-button>
              </a-descriptions-item>
            </a-descriptions>
            <a-space>
              <router-link :to="{name: 'problem.submit', params: {id: problem.id}}">
                <a-button type="primary">
                  提交
                </a-button>
              </router-link>
              <router-link :to="{name: 'solutions', params: {id: problem.id}}">
                <a-button type="danger" >
                  查看题解
                </a-button>
              </router-link>
              <router-link :to="{name: 'solution.add', params: {id: problem.id}}">
                <a-butten type="primary">
                  创建题解
                </a-butten>
              </router-link>
            </a-space>
          </a-card>
          <a-card class="submission_card" v-if="!isGuest">
            <template slot="title">最近提交</template>
            <a-list size="small" bordered :data-source="submissions">
              <a-list-item slot="renderItem" slot-scope="s">
                <router-link :to="{name:'submission', params: {id:s.id}}" style="color: black;width: 100%;">
                  <a-row>
                    <a-col :span="4">
                      {{ s.id }}
                    </a-col>
                    <a-col :span="12">
                      <run-status :status="s.status" :score="s.score"/>
                    </a-col>
                    <a-col :span="8">
                      {{ format(s.created_at) }}
                    </a-col>
                  </a-row>
                </router-link>
              </a-list-item>
            </a-list>
          </a-card>
        </a-space>
      </a-col>
    </a-row>
  </a-spin>
</template>

<script>
import { getProblem } from '@/api/problem'
import { getSubmissions } from '@/api/submission'
import Markdown from '@/components/Editor/Markdown'
import RunStatus from '@/components/RunStatus'
import TestCase from '@/components/TestCase'
import config from '@/config/config'
import request from '@/utils/request'
import download from 'js-file-download'
import languageConf from '@/config/languageConf'
import Language from '@/components/Language'
import moment from 'moment'
import comparerConf from '@/config/comparerConf'

export default {
  name: 'Problem',
  components: {
    Markdown,
    TestCase,
    RunStatus,
    Language
  },
  data () {
    return {
      comparerConf,
      languageConf,
      config,
      id: this.$route.params.id,
      problem_loading: true,
      submission_loading: true,
      downloading: false,
      download_message: '',
      isGuest: this.$store.state.user.info.isGuest,
      can_edit_problem: this.$store.getters.can('update_problem', 'problem', this.$route.params.id) || this.$store.getters.can('update_problem'),
      can_read_problem: this.$store.getters.can('read_problem', 'problem', this.$route.params.id) || this.$store.getters.can('read_problem'),
      can_read_secret: this.$store.getters.can('read_problem_secrets', 'problem', this.$route.params.id) || this.$store.getters.can('read_problem_secrets'),
      problem: {
        id: this.$route.params.id,
        name: '',
        description: '',
        language_allowed: [],
        time_limit: 0,
        memory_limit: 0,
        privacy: true,
        public: true,
        build_arg: '',
        compare_script_name: '',
        attachment_file_name: '',
        test_cases: []
      },
      submissions: []
    }
  },
  mounted () {
    this.fetch()
  },
  methods: {
    format (time) {
      return moment(time).fromNow()
    },

    // 获取题目
    fetch () {
      this.problem_loading = true
      getProblem(this.id).then(data => {
        this.problem_loading = false
        data.problem.test_cases.sort((a, b) => {
          if (a.sample === b.sample) { return a.id - b.id }
          return !a.sample ? 1 : -1 // make sample testcase top.
        })
        this.problem = data.problem
        this.download_message = data.problem.attachment_file_name
      }).catch(err => {
        this.$error({
          content: '遇到错误：' + err.message
        })
        console.error(err)
      })
      if (!this.isGuest) {
        getSubmissions({
          problem_id: this.id,
          user_id: this.$store.state.user.info.id,
          limit: 5
        }).then(data => {
          this.submission_loading = false
          this.submissions = data.submissions
        }).catch(err => {
          this.$error({
            content: '遇到错误：' + err.message
          })
          console.error(err)
        })
      }
    },
    downloadAttachment () {
      const url = config.apiUrl + '/api/problem/' + this.problem.id + '/attachment_file'
      this.downloading = true
      this.download_message = '下载中'
      request({
        timeout: 0,
        url: url,
        method: 'get',
        responseType: 'arraybuffer',
        onDownloadProgress: (progressEvent) => {
          console.log(progressEvent)
          const percentCompleted = Math.floor(progressEvent.loaded / progressEvent.total * 100)
          console.log('completed: ', percentCompleted)
          this.download_message = `已下载 ${percentCompleted} %`
        }
      }).then(resp => {
        this.download_message = this.problem.attachment_file_name
        this.downloading = false
        download(resp, this.problem.attachment_file_name)
      }).catch(err => {
        this.download_message = this.problem.attachment_file_name
        this.downloading = false
        console.log(err)
        this.$error({
          content: '下载失败！' + err.message
        })
      })
    }
  }
}
</script>
<style scoped lang="sass">
.ps
  height: 300px
</style>
<style lang="sass">
.submission_card
  .ant-card-body
    padding: 0
  .ant-list
    border: 0
.problem_spin
  height: 100%
  .ant-spin-container
    height: 100%
</style>
