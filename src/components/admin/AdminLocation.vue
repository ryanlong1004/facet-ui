<template>

  <el-form class="location-form content" ref="add-location-form" :model="formData">

    <h2 class="title">
      <div class="icon">
        <i v-if="(formData.kind === LOCATION_LOCAL) || (formData.kind === LOCATION_LOAD_STORE)" class="far fa-cloud"></i>
        <i v-else-if="formData.kind === LOCATION_REMOTE" class="far fa-server"></i>
        <img v-else :src="getImageUrl(formData.kind)" />
      </div>
      <span>{{ prettyTitle }}</span>
    </h2>

    <fieldset :disabled="saving === true">

    <el-form-item label="Name (for reference only)" prop="name" :rules="{ required: true, message: 'Name is required', trigger: 'blur' }">
      <el-input v-model="formData.name" @keyup.enter.native="submit"></el-input>
    </el-form-item>

    <div v-if="formData.kind === 'local'">
      <el-form-item label="Path" prop="config.path" :rules="{ required: true, message: 'Path is required', trigger: 'blur' }">
        <el-input
          @keyup.enter.native="submit"
          placeholder="/path/to/directory"
          v-model="formData.config.path"
        ></el-input>
      </el-form-item>
    </div>

    <div v-if="formData.kind === 'remote'">
      <el-form-item label="Server Connection" prop="config.source" :rules="{ required: true, message: 'Server Connection is required', trigger: 'blur' }">
        <el-input
          @keyup.enter.native="submit"
          placeholder="192.168.50.101:/data"
          v-model="formData.config.source"
        ></el-input>
      </el-form-item>
      <el-form-item label="Type" prop="config.type" :rules="{ required: true, message: 'Type is required', trigger: 'blur' }">
        <el-select v-model="formData.config.type">
          <el-option value="nfs" label="NFS"></el-option>
          <el-option value="cifs" label="CIFS"></el-option>
          <el-option value="auto" label="AUTO"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="Options (for mount command)">
        <el-input
          :autosize="{ minRows: 3, maxRows: 6 }"
          @keyup.enter.native="submit"
          type="textarea"
          v-model="formData.config.options
        "></el-input>
      </el-form-item>
    </div>

    <div v-if="formData.kind === 'azure'">
      <el-form-item label="Storage account name" prop="config.account" :rules="{ required: true, message: 'Storage account name is required', trigger: 'blur' }">
        <el-input v-model="formData.config.account" @keyup.enter.native="submit"></el-input>
      </el-form-item>
      <el-form-item label="Access key" prop="config.key" :rules="{ required: true, message: 'Access key is required', trigger: 'blur' }">
        <el-input type="password" onfocus="this.value=''" v-model="formData.config.key" @keyup.enter.native="submit"></el-input>
      </el-form-item>
    </div>

    <div v-if="formData.kind === 'b2'">
      <el-form-item label="Application Key" prop="config.application_key" :rules="{ required: true, message: 'Application key is required', trigger: 'blur' }">
        <el-input type="password" onfocus="this.value=''" v-model="formData.config.application_key" @keyup.enter.native="submit"></el-input>
      </el-form-item>
      <el-form-item label="Account ID" prop="config.account_id">
        <el-input
          v-model="formData.config.account_id"
          placeholder="Required if using a master application key"
          @keyup.enter.native="submit"
        ></el-input>
      </el-form-item>
      <el-form-item label="Application Key ID" prop="config.application_key_id">
        <el-input
          type="password" onfocus="this.value=''"
          v-model="formData.config.application_key_id"
          placeholder="Required if not using a master application key"
          @keyup.enter.native="submit"
        ></el-input>
      </el-form-item>
    </div>

    <div v-if="formData.kind === 'google'">
      <el-form-item label="Service Account JSON Configuration" prop="config.json" :rules="{ required: true, message: 'JSON Configuration is required', trigger: 'blur' }">
        <el-input
          :autosize="{ minRows: 3, maxRows: 6 }"
          @keyup.enter.native="submit"
          type="textarea"
          v-model="formData.config.json"
          onfocus="this.value=''"
        ></el-input>
      </el-form-item>
      <el-form-item label="Project ID" prop="config.project_id" :rules="{ required: true, message: 'Project ID is required', trigger: 'blur' }">
        <el-input v-model="formData.config.project_id" @keyup.enter.native="submit"></el-input>
      </el-form-item>
    </div>

    <div v-if="formData.kind === 'swift'">
      <el-form-item label="Storage User Name" prop="config.username" :rules="{ required: true, message: 'Storage User Name is required', trigger: 'blur' }">
        <el-input v-model="formData.config.username" @keyup.enter.native="submit"></el-input>
      </el-form-item>
      <el-form-item label="Storage API Key" prop="config.key" :rules="{ required: true, message: 'Storage API Key is required', trigger: 'blur' }">
        <el-input type="password" onfocus="this.value=''" v-model="formData.config.key" @keyup.enter.native="submit"></el-input>
      </el-form-item>
      <el-form-item label="Tenant Name" prop="config.tenant_name" :rules="{ required: true, message: 'Tenant Name is required', trigger: 'blur' }">
        <el-input v-model="formData.config.tenant_name" @keyup.enter.native="submit"></el-input>
      </el-form-item>
      <el-form-item label="Tenant Authentication URL" prop="config.tenant_auth_url" :rules="{ required: true, message: 'Tenant Auth URL is required', trigger: 'blur' }">
        <el-input v-model="formData.config.tenant_auth_url" @keyup.enter.native="submit"></el-input>
      </el-form-item>
    </div>

    <div v-if="formData.kind === 's3'">
      <el-form-item>
        <el-checkbox v-model="s3Compatible">Is this S3 compatible storage? (i.e. Minio, Ceph, Eucalyptus, etc.)</el-checkbox>
      </el-form-item>
      <el-form-item label="Access Key ID" prop="config.access_key_id" :rules="{ required: true, message: 'Access Key ID is required', trigger: 'blur' }">
        <el-input v-model="formData.config.access_key_id" @keyup.enter.native="submit"></el-input>
      </el-form-item>
      <el-form-item label="Secret Key" prop="config.secret_key" :rules="{ required: true, message: 'Secret Key is required', trigger: 'blur' }">
        <el-input type="password" onfocus="this.value=''" v-model="formData.config.secret_key" @keyup.enter.native="submit"></el-input>
      </el-form-item>
      <el-form-item label="Region" prop="config.region" v-if="!s3Compatible">
        <el-input
          v-model="formData.config.region"
          placeholder="Ex: us-west-1"
          @keyup.enter.native="submit"
        ></el-input>
      </el-form-item>
      <el-form-item label="Domain Endpoint" prop="config.endpoint" v-if="s3Compatible">
        <el-input
          v-model="formData.config.endpoint"
          placeholder="Ex: endpoint.graymeta.com"
          @keyup.enter.native="submit"
        ></el-input>
      </el-form-item>
      <el-form-item label="SSL Disabled" prop="config.disable_ssl" v-if="s3Compatible">
        <el-switch v-model="formData.config.disable_ssl"
         active-value="true"
         inactive-value="false"
         on-text="YES"
         off-text="NO"></el-switch>
      </el-form-item>
    </div>

    <div v-if="formData.kind === 'dell'">
      <el-form-item label="Access Key ID" prop="config.access_key_id" :rules="{ required: true, message: 'Access Key ID is required', trigger: 'blur' }">
        <el-input v-model="formData.config.access_key_id" @keyup.enter.native="submit"></el-input>
      </el-form-item>
      <el-form-item label="Secret Key" prop="config.secret_key" :rules="{ required: true, message: 'Secret Key is required', trigger: 'blur' }">
        <el-input type="password" onfocus="this.value=''" v-model="formData.config.secret_key" @keyup.enter.native="submit"></el-input>
      </el-form-item>
      <el-form-item label="Domain Endpoint" prop="config.endpoint">
        <el-input
          v-model="formData.config.endpoint"
          placeholder="Ex: endpoint.graymeta.com"
          @keyup.enter.native="submit"
        ></el-input>
      </el-form-item>
    </div>

    <div v-if="formData.kind === 'oracle'">
      <el-form-item label="Username" prop="config.username" :rules="{ required: true, message: 'Username is required', trigger: 'blur' }">
        <el-input v-model="formData.config.username" @keyup.enter.native="submit"></el-input>
      </el-form-item>
      <el-form-item label="Password" prop="config.password" :rules="{ required: true, message: 'Password is required', trigger: 'blur' }">
        <el-input
          type="password" onfocus="this.value=''"
          v-model="formData.config.password"
          @keyup.enter.native="submit"
        ></el-input>
      </el-form-item>
      <el-form-item label="Authorization Endpoint" prop="config.authorization_endpoint" :rules="{ required: true, message: 'Authorization Endpoint is required', trigger: 'blur' }">
        <el-input v-model="formData.config.authorization_endpoint" @keyup.enter.native="submit"></el-input>
      </el-form-item>
    </div>

    <div v-if="formData.kind === 'cloudian'">
      <el-form-item label="Access Key ID" prop="config.access_key_id" :rules="{ required: true, message: 'Access Key ID is required', trigger: 'blur' }">
        <el-input v-model="formData.config.access_key_id" @keyup.enter.native="submit"></el-input>
      </el-form-item>
      <el-form-item label="Secret Key" prop="config.secret_key" :rules="{ required: true, message: 'Secret Key is required', trigger: 'blur' }">
        <el-input type="password" onfocus="this.value=''" v-model="formData.config.secret_key" @keyup.enter.native="submit"></el-input>
      </el-form-item>
      <el-form-item label="Endpoint" prop="config.endpoint" :rules="{ required: true, message: 'Endpoint is required', trigger: 'blur' }">
        <el-input v-model="formData.config.endpoint" placeholder="Ex: endpoint.graymeta.com" @keyup.enter.native="submit"></el-input>
      </el-form-item>
    </div>

    <div v-if="formData.kind === 'wasabi'">
      <el-form-item label="Access Key ID" prop="config.access_key_id" :rules="{ required: true, message: 'Access Key ID is required', trigger: 'blur' }">
        <el-input v-model="formData.config.access_key_id" @keyup.enter.native="submit"></el-input>
      </el-form-item>
      <el-form-item label="Secret Key" prop="config.secret_key" :rules="{ required: true, message: 'Secret Key is required', trigger: 'blur' }">
        <el-input type="password" onfocus="this.value=''" v-model="formData.config.secret_key" @keyup.enter.native="submit"></el-input>
      </el-form-item>
      <el-form-item label="Region" prop="config.region" :rules="{ required: true, message: 'Region is required', trigger: 'blur' }">
        <el-select v-model="formData.config.region">
          <el-option value="us-east-1" label="us-east-1"></el-option>
          <el-option value="us-east-2" label="us-east-2"></el-option>
          <el-option value="us-central-1" label="us-central-1"></el-option>
          <el-option value="us-west-1" label="us-west-1"></el-option>
          <el-option value="ca-central-1" label="ca-central-1"></el-option>
          <el-option value="eu-central-1" label="eu-central-1"></el-option>
          <el-option value="eu-central-2" label="eu-central-2"></el-option>
          <el-option value="eu-west-1" label="eu-west-1"></el-option>
          <el-option value="eu-west-2" label="eu-west-2"></el-option>
          <el-option value="ap-northeast-1" label="ap-northeast-1"></el-option>
          <el-option value="ap-northeast-2" label="ap-northeast-2"></el-option>
          <el-option value="ap-southeast-1" label="ap-southeast-1"></el-option>
          <el-option value="ap-southeast-2" label="ap-southeast-2"></el-option>
        </el-select>
      </el-form-item>
    </div>

    <div v-if="formData.kind === 'wasabibeta'">
      <el-form-item label="Access Key ID" prop="config.access_key_id" :rules="{ required: true, message: 'Access Key ID is required', trigger: 'blur' }">
        <el-input v-model="formData.config.access_key_id" @keyup.enter.native="submit"></el-input>
      </el-form-item>
      <el-form-item label="Secret Key" prop="config.secret_key" :rules="{ required: true, message: 'Secret Key is required', trigger: 'blur' }">
        <el-input type="password" onfocus="this.value=''" v-model="formData.config.secret_key" @keyup.enter.native="submit"></el-input>
      </el-form-item>
      <el-form-item label="Region" prop="config.region" :rules="{ required: true, message: 'Region is required', trigger: 'blur' }">
        <el-select v-model="formData.config.region">
          <el-option value="us-east-1" label="us-east-1"></el-option>
        </el-select>
      </el-form-item>
    </div>

    <div v-if="formData.kind === 'digitalocean'">
      <el-form-item label="Access Key ID" prop="config.access_key_id" :rules="{ required: true, message: 'Access Key ID is required', trigger: 'blur' }">
        <el-input v-model="formData.config.access_key_id" @keyup.enter.native="submit"></el-input>
      </el-form-item>
      <el-form-item label="Secret Key" prop="config.secret_key" :rules="{ required: true, message: 'Secret Key is required', trigger: 'blur' }">
        <el-input type="password" onfocus="this.value=''" v-model="formData.config.secret_key" @keyup.enter.native="submit"></el-input>
      </el-form-item>
      <el-form-item label="Region" prop="config.region" :rules="{ required: true, message: 'Region is required', trigger: 'blur' }">
        <el-input v-model="formData.config.region" @keyup.enter.native="submit"></el-input>
      </el-form-item>
    </div>

    <div v-if="formData.kind === 'sftp'">
      <el-form-item label="Hostname or IP Address" prop="config.host" :rules="{ required: true, message: 'Host is required', trigger: 'blur' }">
        <el-input v-model="formData.config.host" placeholder="sftp.example.com" @keyup.enter.native="submit"></el-input>
      </el-form-item>
      <el-form-item label="Port" prop="config.port" :rules="{ required: true, message: 'Port is required', trigger: 'blur' }">
        <el-input v-model="formData.config.port" placeholder="22"  @keyup.enter.native="submit"></el-input>
      </el-form-item>
      <el-form-item label="Username" prop="config.username" :rules="{ required: true, message: 'Username is required', trigger: 'blur' }">
        <el-input v-model="formData.config.username" @keyup.enter.native="submit"></el-input>
      </el-form-item>
      <el-form-item label="Password" prop="config.password">
        <el-input type="password" onfocus="this.value=''" v-model="formData.config.password" placeholder="Optional password" @keyup.enter.native="submit"></el-input>
      </el-form-item>
      <el-form-item label="SSH Private Key" prop="config.private_key">
        <el-input onfocus="this.value=''" v-model="formData.config.private_key" placeholder="Optional private key content"  @keyup.enter.native="submit" type="textarea"></el-input>
      </el-form-item>
      <el-form-item label="SSH Private Key Passphrase" prop="config.private_key_passphrase">
        <el-input type="password" onfocus="this.value=''" v-model="formData.config.private_key_passphrase" placeholder="Optional private key passphrase"  @keyup.enter.native="submit"></el-input>
      </el-form-item>
      <el-form-item label="SSH Host Public Key" prop="config.host_public_key">
        <el-input v-model="formData.config.host_public_key" placeholder="Optional SSH host public key in known_hosts format"  @keyup.enter.native="submit"></el-input>
      </el-form-item>
      <el-form-item label="Base Path" prop="config.base_path">
        <el-input v-model="formData.config.base_path" placeholder="Optional relative or absolute server-side path to the root directory"  @keyup.enter.native="submit"></el-input>
      </el-form-item>
    </div>

    <div v-if="formData.kind === 'quantum'">
      <el-form-item label="Mount Path" prop="config.path" :rules="{ required: true, message: 'Mount path is required', trigger: 'blur' }">
        <el-input v-model="formData.config.path" placeholder="/mnt/SAN" @keyup.enter.native="submit"></el-input>
      </el-form-item>
      <el-form-item label="Allow Insecure SSL Connections to the REST API" prop="config.allow_insecure">
        <el-switch v-model="formData.config.allow_insecure"
         active-value="true"
         inactive-value="false"
         on-text="YES"
         off-text="NO"></el-switch>
      </el-form-item>
      <el-form-item label="Marker" prop="config.marker">
        <el-input v-model="formData.config.marker" disabled></el-input>
      </el-form-item>
    </div>

    <div class="button-row">
      <el-button size="mini" type="text" :disabled="saving" @click="cancel">Cancel</el-button>
      <el-button
        :disabled="saving"
        @click="submit"
        type="primary"
        size="mini">
        {{ submitButtonLabel }}
      </el-button>
    </div>

    </fieldset>

  </el-form>
</template>

<script>
import _ from 'lodash'
import api from 'src/api'
import { CONSTANTS } from 'src/constants'
import { getAPIErrorMsg } from 'src/apiHelpers'
import {mapActions} from 'vuex'
import {LOCATIONS} from 'src/store/storeModules'
import {
  ADD_LOCATION,
  DELETE_LOCATION,
  EDIT_GROUPS,
  LOAD_LOCATION_KINDS,
  LOAD_LOCATIONS, UPDATE_LOCATION
} from 'src/store/modules/locations/locations'

const CONFIG = {
  'loadnstore': {
    fields: [],
    pretty: 'Load and Store'
  },
  'local': {
    fields: ['path'],
    pretty: 'Local Storage'
  },
  'remote': {
    fields: ['source', 'type', 'options'],
    pretty: 'Remote Storage'
  },
  'azure': {
    fields: ['account', 'key'],
    pretty: 'Azure Storage'
  },
  'dell': {
    fields: ['access_key_id', 'secret_key', 'endpoint'],
    pretty: 'Dell ECS Object Storage'
  },
  'google': {
    fields: ['json', 'project_id'],
    pretty: 'Google Cloud Storage'
  },
  'swift': {
    fields: ['username', 'key', 'tenant_name', 'tenant_auth_url'],
    pretty: 'Swift Object Storage'
  },
  's3': {
    fields: ['access_key_id', 'secret_key', 'region', 'endpoint', 'disable_ssl'],
    pretty: 'AWS S3 / S3 Compatible Object Storage'
  },
  'oracle': {
    fields: ['username', 'password', 'authorization_endpoint'],
    pretty: 'Oracle Cloud Storage'
  },
  'b2': {
    fields: ['account_id', 'application_key', 'application_key_id'],
    pretty: 'Backblaze B2'
  },
  'cloudian': {
    fields: ['access_key_id', 'secret_key', 'endpoint'],
    pretty: 'Cloudian Object Storage'
  },
  'onedrive': {
    fields: ['account', 'key'],
    pretty: 'OneDrive Storage'
  },
  'sharepoint': {
    fields: ['account', 'key'],
    pretty: 'SharePoint/Teams Storage'
  },
  'sftp': {
    fields: [
        'host',
        'port',
        'username',
        'password',
        'private_key',
        'private_key_passphrase',
        'host_public_key',
        'base_path'
    ],
    pretty: 'SFTP'
  },
  'quantum': {
    fields: [
        'path',
        'allow_insecure',
        'marker'
    ],
    pretty: 'Quantum StorNext'
  },
  'wasabi': {
    fields: ['access_key_id', 'secret_key', 'region'],
    pretty: 'Wasabi'
  },
  'wasabibeta': {
    fields: ['access_key_id', 'secret_key', 'region'],
    pretty: 'WasabiBeta'
  },
  'digitalocean': {
    fields: ['access_key_id', 'secret_key', 'region'],
    pretty: 'DigitalOcean Spaces'
  }
}

export default {
  name: 'add-edit-location',
  data () {
    return {
      saving: false,
      fatalError: false,
      s3Compatible: false,
      quantumAllowInsecure: false,
      originalTitle: '',
      formData: {
        id: null,
        name: '',
        kind: '',
        config: {
          type: '',
          disable_ssl: 'false'
        }
      },
      loadData: {
        config: {
          type: '',
          disable_ssl: 'false'
        }
      },
      LOCATION_REMOTE: CONSTANTS.LOCATION_KIND.REMOTE.id,
      LOCATION_LOCAL: CONSTANTS.LOCATION_KIND.LOCAL.id,
      LOCATION_LOAD_STORE: CONSTANTS.LOCATION_KIND.LOADNSTORE.id
    }
  },
  mounted: function () {
    if (this.$route.name === 'admin-add-location') {
      // add new
      this.formData.kind = this.$route.params.type
    } else {
      // edit existing
      this.loadLocationDetails(this.$route.params.locationId)
    }
  },
  computed: {
    prettyTitle () {
      if (this.formData.id) {
        return `Edit Location "${this.originalTitle}"`
      } else if (this.formData.kind) {
        const prettyType = CONFIG[this.formData.kind] ? CONFIG[this.formData.kind].pretty : 'Location'
        return `Add New ${prettyType}`
      }
      return 'Add New Location'
    },
    submitButtonLabel () {
      if (this.formData.id) {
        return 'Edit Location'
      }
      return 'Add Location'
    }
  },
  methods: {
    ...mapActions(LOCATIONS, {
      addLocation: ADD_LOCATION,
      updateLocation: UPDATE_LOCATION
    }),

    getImageUrl (kind) {
      return this.formData.kind ? require(`../../assets/curio/cloud-${kind}.png`) : ''
    },
    loadLocationDetails (locationId) {
      api.getLocation(locationId)
        .then(response => {
          this.formData = response
          this.loadData.config = {...this.formData.config}
          this.originalTitle = response.name
        })
    },
    cancel () {
      this.$router.push({ name: 'admin-storage' })
    },
    submit () {
      this.$refs['add-location-form'].validate((valid) => {
        if (valid) {
          this.saving = true
          this.fatalError = false
          let payload = {
            name: this.formData.name,
            kind: this.formData.kind,
            config: {}
          }
          if (this.formData.id) {
            payload.id = this.formData.id
            payload.version = this.formData.version
            _.each(CONFIG[this.formData.kind].fields, p => {
              if (this.formData.config[p] !== this.loadData.config[p]) {
                payload.config[p] = this.formData.config[p]
              }
            })
            this.doEditLocation(payload)
          } else {
            _.each(CONFIG[this.formData.kind].fields, p => {
              payload.config[p] = this.formData.config[p]
            })
            this.doAddLocation(payload)
          }
        }
      })
    },
    async doAddLocation (payload) {
      try {
        await this.addLocation(payload)
        this.$message({
          duration: CONSTANTS.MESSAGE_DURATION,
          message: 'Location added successfully',
          showClose: true,
          type: 'success'
        })
        await this.$router.push({name: 'admin-storage'})

      }
      catch (err) {
        this.$message({
          duration: CONSTANTS.MESSAGE_DURATION,
          message: getAPIErrorMsg(err),
          showClose: true,
          type: 'error'
        })
      }
      finally {
        this.saving = false
      }
    },
    async doEditLocation (payload) {
      try {
        this.updateLocation(payload)
        this.$message({
          duration: CONSTANTS.MESSAGE_DURATION,
          message: 'Location edited successfully',
          showClose: true,
          type: 'success'
        })
        await this.$router.push({ name: 'admin-storage' })
      }
      catch (err) {
        this.$message({
          duration: CONSTANTS.MESSAGE_DURATION,
          message: getAPIErrorMsg(err),
          showClose: true,
          type: 'error'
        })
      }
      finally {
        this.saving = false
      }
    }
  }
}
</script>
<style lang="less">
.admin-page .location-form.content .el-form-item {
  height: auto;
}
</style>
<style lang="less" scoped>
  .location-form {
    padding: 20px;
  }
  h2.title {
    align-items: center;
    display: flex;
    .icon {
      margin-right: 5px;
      img {
        height: auto;
        width: 80px;
      }
    }
  }
  fieldset {
    border: 0;
    margin-top: 25px;
    padding: 0;
  }
  .button-row {
    display: flex;
    justify-content: flex-end;
  }
</style>
